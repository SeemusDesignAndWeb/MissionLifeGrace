import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { capturePayPalOrder, getPayPalOrder } from '$lib/server/paypal';
import { getConferenceBooking, saveConferenceBooking, saveConferencePaymentSchedule, getConference, getUserAccountByEmail } from '$lib/server/database';

export const POST = async ({ request }) => {
	try {
		const { orderId, testMode } = await request.json();

		// Helper to check account status
		const checkAccountStatus = (email) => {
			if (!email) return { exists: false, verified: false };
			const account = getUserAccountByEmail(email);
			return {
				exists: !!account,
				verified: account ? account.verified : false
			};
		};

		// TEST mode: Simulate successful payment
		if (env.TEST === 'true' || testMode) {
			console.log('🧪 TEST MODE: Simulating PayPal payment capture');
			
			// Extract booking ID from test order ID or find by orderId
			let booking;
			if (orderId.startsWith('TEST-')) {
				const bookingId = orderId.replace('TEST-', '');
				booking = getConferenceBooking(bookingId);
			} else {
				// Find by PayPal order ID
				const { getConferenceBookings } = await import('$lib/server/database');
				const bookings = getConferenceBookings();
				booking = bookings.find(b => b.paypalOrderId === orderId || b.id === orderId);
			}

			if (!booking) {
				return json({ error: 'Booking not found' }, { status: 404 });
			}

			// Get the amount from the booking (stored during order creation in TEST mode)
			// or calculate based on payment method
			let amountPaid = booking.testPaymentAmount;
			
			// If testPaymentAmount wasn't set, calculate it
			if (!amountPaid || amountPaid <= 0) {
				amountPaid = booking.totalAmount - (booking.paidAmount || 0);
				
				// If it's a partial payment method, use the appropriate amount
				if (booking.paymentMethod === 'deposit20') {
					amountPaid = booking.totalAmount * 0.2;
				} else if (booking.paymentMethod === 'deposit' || booking.paymentMethod === 'installment') {
					const conference = getConference(booking.conferenceId);
					if (conference?.paymentSettings) {
						if (conference.paymentSettings.depositAmount) {
							amountPaid = conference.paymentSettings.depositAmount;
						} else if (conference.paymentSettings.depositPercentage) {
							amountPaid = booking.totalAmount * (conference.paymentSettings.depositPercentage / 100);
						}
					}
				}
			}
			
			// Clear testPaymentAmount after use
			if (booking.testPaymentAmount) {
				delete booking.testPaymentAmount;
			}

			// Add payment to existing paid amount
			const newPaidAmount = (booking.paidAmount || 0) + amountPaid;
			booking.paidAmount = newPaidAmount;

			// Check if payment is complete
			if (newPaidAmount >= booking.totalAmount) {
				booking.paymentStatus = 'paid';
				booking.paidAmount = booking.totalAmount;
			} else {
				booking.paymentStatus = 'partial';
			}

			booking.paypalOrderId = orderId;
			booking.paypalOrderStatus = 'COMPLETED';
			booking.paypalCaptureId = `TEST-CAPTURE-${Date.now()}`;
			booking.paymentDate = new Date().toISOString();
			saveConferenceBooking(booking);

			console.log('🧪 TEST MODE: Payment simulated successfully', {
				bookingId: booking.id,
				paymentStatus: booking.paymentStatus,
				amountPaid
			});

			const accountStatus = checkAccountStatus(booking.groupLeaderEmail);

			return json({
				success: true,
				bookingId: booking.id,
				status: booking.paymentStatus,
				amountPaid,
				accountExists: accountStatus.exists,
				accountVerified: accountStatus.verified
			});
		}

		if (!orderId) {
			return json({ error: 'Order ID is required' }, { status: 400 });
		}

		// Capture the PayPal order
		const captureResult = await capturePayPalOrder(orderId);

		if (captureResult.status !== 'COMPLETED') {
			return json({ error: 'Payment not completed' }, { status: 400 });
		}

		// Find booking by PayPal order ID
		const { getConferenceBookings } = await import('$lib/server/database');
		const bookings = getConferenceBookings();
		const booking = bookings.find(b => b.paypalOrderId === orderId);

		if (!booking) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}

		// Get payment details
		const purchaseUnit = captureResult.purchase_units[0];
		const payment = purchaseUnit.payments.captures[0];
		const amountPaid = parseFloat(payment.amount.value);

		// Update booking payment status
		// Add the payment amount to existing paid amount
		const newPaidAmount = (booking.paidAmount || 0) + amountPaid;
		booking.paidAmount = newPaidAmount;

		// Check if payment is complete
		if (newPaidAmount >= booking.totalAmount) {
			// Full payment completed
			booking.paymentStatus = 'paid';
			booking.paidAmount = booking.totalAmount; // Ensure it's exactly the total
		} else {
			// Partial payment
			booking.paymentStatus = 'partial';
			
			// Only create payment schedule if this is an installment payment method
			if (booking.paymentMethod === 'deposit' || booking.paymentMethod === 'installment') {
				const conference = getConference(booking.conferenceId);
				if (conference?.paymentSettings) {
					const { installmentCount, installmentInterval } = conference.paymentSettings;
					
					// Only create schedule if it doesn't exist yet
					const { getConferencePaymentSchedules } = await import('$lib/server/database');
					const existingSchedules = getConferencePaymentSchedules(booking.id);
					
					if (existingSchedules.length === 0) {
						// Calculate remaining amount
						const remainingAmount = booking.totalAmount - newPaidAmount;
						const installmentAmount = remainingAmount / (installmentCount - 1);
						
						// Create payment schedule entries
						const today = new Date();
						for (let i = 1; i < installmentCount; i++) {
							const dueDate = new Date(today);
							dueDate.setDate(dueDate.getDate() + (installmentInterval * i));
							
							saveConferencePaymentSchedule({
								id: `schedule-${booking.id}-${i}`,
								bookingId: booking.id,
								conferenceId: booking.conferenceId,
								amount: installmentAmount,
								dueDate: dueDate.toISOString().split('T')[0],
								status: 'pending',
								installmentNumber: i + 1,
								createdAt: new Date().toISOString()
							});
						}
					}
				}
			}
		}

		booking.paypalOrderStatus = captureResult.status;
		booking.paypalCaptureId = payment.id;
		booking.paymentDate = new Date().toISOString();
		saveConferenceBooking(booking);

		const accountStatus = checkAccountStatus(booking.groupLeaderEmail);

		return json({
			success: true,
			bookingId: booking.id,
			status: booking.paymentStatus,
			amountPaid,
			accountExists: accountStatus.exists,
			accountVerified: accountStatus.verified
		});
	} catch (error) {
		console.error('Failed to capture PayPal payment:', error);
		return json({ error: error.message || 'Failed to capture payment' }, { status: 500 });
	}
};

