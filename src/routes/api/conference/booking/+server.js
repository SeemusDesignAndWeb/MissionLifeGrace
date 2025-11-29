import { json } from '@sveltejs/kit';
import {
	saveConferenceBooking,
	saveConferenceAttendee,
	getConferenceDiscountCode,
	saveConferenceDiscountCode,
	getConference,
	getConferenceTicketType,
	saveConferenceTicketType,
	getConferenceAttendees
} from '$lib/server/database';
import { sendBookingConfirmationEmail, sendChildRegistrationNotification } from '$lib/server/conference-emails';

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
		for (const attendee of attendees) {
			if (attendee.ticketTypeId) {
				const ticketType = getConferenceTicketType(attendee.ticketTypeId);
				if (!ticketType || !ticketType.enabled) {
					return json({ error: `Invalid ticket type for attendee ${attendee.fullName}` }, { status: 400 });
				}
				if (ticketType.capacity > 0 && (ticketType.sold || 0) >= ticketType.capacity) {
					return json({ error: `Ticket type ${ticketType.name} is sold out` }, { status: 400 });
				}
			}
		}

		// Save booking
		saveConferenceBooking(booking);

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

			const attendeeData = {
				...attendee,
				bookingId: booking.id,
				age
			};
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

		// Send confirmation emails (async, don't wait for completion)
		try {
			const savedAttendees = getConferenceAttendees(booking.id);
			
			// Send booking confirmation email
			await sendBookingConfirmationEmail({
				booking,
				conference,
				attendees: savedAttendees
			});

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
					booking,
					conference,
					childAttendees,
					childGroupLeaders
				});
			}
		} catch (emailError) {
			// Log but don't fail the booking if email fails
			console.error('Failed to send confirmation emails:', emailError);
		}

		return json({ success: true, bookingId: booking.id, bookingReference: booking.bookingReference });
	} catch (error) {
		console.error('Failed to process booking:', error);
		return json({ error: 'Failed to process booking' }, { status: 500 });
	}
};

