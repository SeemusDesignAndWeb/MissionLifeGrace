import { json } from '@sveltejs/kit';
import {
	saveConferenceBooking,
	saveConferenceAttendee,
	getConferenceDiscountCode,
	saveConferenceDiscountCode,
	getConference,
	getConferenceTicketType,
	saveConferenceTicketType,
	getConferenceAttendees,
	getUserAccountByEmail,
	saveUserAccount,
	saveEmailVerificationCode
} from '$lib/server/database';
import { sendBookingConfirmationEmail, sendChildRegistrationNotification, sendVerificationCodeEmail, sendAdminBookingNotification } from '$lib/server/conference-emails';
import { generateVerificationCode } from '$lib/server/user-auth';

export const POST = async ({ request }) => {
	try {
		const { booking, attendees, discountCode } = await request.json();

		// Validate conference exists and registration is open
		const conference = getConference(booking.conferenceId);
		if (!conference || !conference.published || !conference.registrationOpen) {
			return json({ error: 'Conference not available for registration' }, { status: 400 });
		}

		// Validate discount code if provided
		let discountCodeData = null;
		if (discountCode) {
			discountCodeData = getConferenceDiscountCode(discountCode, booking.conferenceId);
			if (discountCodeData && discountCodeData.enabled) {
				// Check expiry
				if (discountCodeData.expiryDate && new Date(discountCodeData.expiryDate) < new Date()) {
					return json({ error: 'Discount code has expired' }, { status: 400 });
				}
				// Check usage limit
				if (discountCodeData.maxUsage > 0 && (discountCodeData.usedCount || 0) >= discountCodeData.maxUsage) {
					return json({ error: 'Discount code has reached its usage limit' }, { status: 400 });
				}
			} else {
				return json({ error: 'Invalid discount code' }, { status: 400 });
			}
		}

		// Validate ticket types and capacity
		// Also recalculate subtotal here to ensure integrity
		let calculatedSubtotal = 0;
		
		for (const attendee of attendees) {
			if (attendee.ticketTypeId) {
				const ticketType = getConferenceTicketType(attendee.ticketTypeId);
				if (!ticketType || !ticketType.enabled) {
					return json({ error: `Invalid ticket type for attendee ${attendee.fullName}` }, { status: 400 });
				}
				if (ticketType.capacity > 0 && (ticketType.sold || 0) >= ticketType.capacity) {
					return json({ error: `Ticket type ${ticketType.name} is sold out` }, { status: 400 });
				}
				
				// Calculate price for this ticket
				// Use the same logic as frontend: Conference Early Bird -> Ticket Early Bird -> Ticket Late -> Standard
				let price = ticketType.price;
				const now = new Date();
				
				// 1. Conference-level Early Bird
				if (conference.earlyBirdStartDate && conference.earlyBirdEndDate && conference.earlyBirdDiscountAmount > 0) {
					const startDate = new Date(conference.earlyBirdStartDate);
					const endDate = new Date(conference.earlyBirdEndDate);
					// Set end date to end of day
					endDate.setHours(23, 59, 59, 999);
					
					if (now >= startDate && now <= endDate) {
						price = Math.max(0, ticketType.price - conference.earlyBirdDiscountAmount);
					}
				} else {
					// 2. Ticket-level Early Bird (fallback)
					if (ticketType.earlyBirdEndDate && new Date(ticketType.earlyBirdEndDate) > now && ticketType.earlyBirdPrice > 0) {
						price = ticketType.earlyBirdPrice;
					}
					// 3. Ticket-level Late Price
					else if (ticketType.latePriceStartDate && new Date(ticketType.latePriceStartDate) <= now && ticketType.latePrice > 0) {
						price = ticketType.latePrice;
					}
				}
				
				calculatedSubtotal += price;
			}
		}

		// Recalculate totals
		let calculatedDiscountAmount = 0;
		if (discountCodeData) {
			if (discountCodeData.type === 'percentage') {
				calculatedDiscountAmount = calculatedSubtotal * (discountCodeData.value / 100);
			} else {
				calculatedDiscountAmount = discountCodeData.value;
			}
		}
		
		const calculatedTotalAmount = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);

		// Secure the booking object
		// Overwrite client-provided values with server-calculated ones
		// Generate new ID and Reference to prevent overwrites
		const secureBooking = {
			...booking,
			id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			bookingReference: `CONF-${Date.now().toString(36).toUpperCase()}`,
			subtotal: calculatedSubtotal,
			discountAmount: calculatedDiscountAmount,
			totalAmount: calculatedTotalAmount,
			// Force payment status to initial state
			paymentStatus: booking.paymentMethod === 'deposit20' ? 'partial' : 'unpaid',
			paidAmount: 0, // Always start with 0 paid
			createdAt: new Date().toISOString(),
			archived: false,
			archivedAt: null
		};

		// Save booking
		saveConferenceBooking(secureBooking);

		// Save attendees
		for (const attendee of attendees) {
			// Calculate age
			let age = null;
			if (attendee.dateOfBirth) {
				const today = new Date();
				const birth = new Date(attendee.dateOfBirth);
				age = today.getFullYear() - birth.getFullYear();
				const monthDiff = today.getMonth() - birth.getMonth();
				if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
					age--;
				}
			}

			// Create attendee data
			const attendeeData = {
				...attendee,
				bookingId: secureBooking.id,
				age
			};

			// Ensure unique ID: Remove ALL client-provided IDs to force new records
			// This prevents overwriting existing attendees of other bookings
			if (attendeeData.id) {
				delete attendeeData.id;
			}

			saveConferenceAttendee(attendeeData);

			// Update ticket type sold count
			if (attendee.ticketTypeId) {
				const ticketType = getConferenceTicketType(attendee.ticketTypeId);
				if (ticketType) {
					ticketType.sold = (ticketType.sold || 0) + 1;
					saveConferenceTicketType(ticketType);
				}
			}
		}

		// Update discount code usage
		if (discountCodeData) {
			discountCodeData.usedCount = (discountCodeData.usedCount || 0) + 1;
			saveConferenceDiscountCode(discountCodeData);
		}

		// Check if account setup is needed (for partial/unpaid bookings)
		let accountNeedsSetup = false;
		let accountExists = false;
		let accountVerified = false;
		let accountCreated = false; // Track if we actually created an account
		
		// Link booking to existing account if found, regardless of payment status
		if (secureBooking.groupLeaderEmail) {
			try {
				const userAccount = getUserAccountByEmail(secureBooking.groupLeaderEmail);
				
				if (!userAccount) {
					// Account doesn't exist
					if (secureBooking.paymentStatus !== 'paid') {
						// Create account immediately and send verification code
						accountNeedsSetup = true;
						accountCreated = true;
						
						// Create user account (not verified yet, no password yet)
						const newUserAccount = {
							id: `user-${Date.now()}`,
							email: secureBooking.groupLeaderEmail.toLowerCase(),
							passwordHash: null, // Password will be set after email verification
							verified: false,
							emailVerified: false,
							bookingIds: [secureBooking.id],
							createdAt: new Date().toISOString()
						};
						saveUserAccount(newUserAccount);
						
						// Generate and save verification code
						const verificationCode = generateVerificationCode();
						const verification = {
							email: secureBooking.groupLeaderEmail.toLowerCase(),
							code: verificationCode,
							used: false,
							createdAt: new Date().toISOString()
						};
						saveEmailVerificationCode(verification);
						
						// Send verification email immediately
						try {
							await sendVerificationCodeEmail({
								email: secureBooking.groupLeaderEmail,
								code: verificationCode,
								name: secureBooking.groupLeaderName
							});
							console.log('Verification code sent to', secureBooking.groupLeaderEmail);
						} catch (emailError) {
							console.error('Failed to send verification email:', emailError);
						}
					}
				} else {
					// Account exists
					accountExists = true;
					accountVerified = userAccount.verified;

					// Link booking
					if (!userAccount.bookingIds) {
						userAccount.bookingIds = [];
					}
					if (!userAccount.bookingIds.includes(secureBooking.id)) {
						userAccount.bookingIds.push(secureBooking.id);
						saveUserAccount(userAccount);
					}
					
					// Check verification status
					if (!userAccount.verified && secureBooking.paymentStatus !== 'paid') {
						accountNeedsSetup = true;
						
						// Resend verification code if needed
						const verificationCode = generateVerificationCode();
						const verification = {
							email: secureBooking.groupLeaderEmail.toLowerCase(),
							code: verificationCode,
							used: false,
							createdAt: new Date().toISOString()
						};
						saveEmailVerificationCode(verification);
						
						// Send verification email
						try {
							await sendVerificationCodeEmail({
								email: secureBooking.groupLeaderEmail,
								code: verificationCode,
								name: secureBooking.groupLeaderName
							});
							console.log('Verification code resent to', secureBooking.groupLeaderEmail);
						} catch (emailError) {
							console.error('Failed to send verification email:', emailError);
						}
					}
				}
			} catch (accountError) {
				console.error('Failed to check/link user account:', accountError);
			}
		}

		// Send confirmation emails (async, don't wait for completion)
		try {
			const savedAttendees = getConferenceAttendees(secureBooking.id);
			
			// Send booking confirmation email to user
			await sendBookingConfirmationEmail({
				booking: secureBooking,
				conference,
				attendees: savedAttendees,
				accountCreated: accountCreated // Pass flag indicating if account was actually created
			});

			// Send admin notification (don't wait for it)
			sendAdminBookingNotification({
				booking: secureBooking,
				conference,
				attendees: savedAttendees
			}).catch(err => console.error('Admin notification failed:', err));

			// Check for child attendees and send notifications
			const childAttendees = savedAttendees.filter(a => {
				const ticketType = getConferenceTicketType(a.ticketTypeId);
				return ticketType && ticketType.type === 'child';
			});

			if (childAttendees.length > 0) {
				// Get child group leader emails from conference settings or use defaults
				const childGroupLeaders = {
					'0-5 years': conference.childGroupLeaders?.['0-5'] || null,
					'6-8 years': conference.childGroupLeaders?.['6-8'] || null,
					'9-12 years': conference.childGroupLeaders?.['9-12'] || null
				};

				await sendChildRegistrationNotification({
					booking: secureBooking,
					conference,
					childAttendees,
					childGroupLeaders
				});
			}
		} catch (emailError) {
			// Log but don't fail the booking if email fails
			console.error('Failed to send confirmation emails:', emailError);
		}

		return json({ 
			success: true, 
			bookingId: secureBooking.id, 
			bookingReference: secureBooking.bookingReference,
			accountNeedsSetup,
			accountExists,
			accountVerified
		});
	} catch (error) {
		console.error('Failed to process booking:', error);
		return json({ error: 'Failed to process booking' }, { status: 500 });
	}
};

