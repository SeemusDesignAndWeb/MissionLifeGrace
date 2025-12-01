import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { capturePayPalOrder } from '$lib/server/paypal';
import { getEventBooking, saveEventBooking, getEvent } from '$lib/server/database';
import { sendEventBookingConfirmationEmail, sendAdminPaymentNotification } from '$lib/server/conference-emails';

export const POST = async ({ request }) => {
	try {
		const { orderId, testMode } = await request.json();

		// TEST mode: Simulate successful payment
		if (env.TEST === 'true' || testMode) {
			console.log('🧪 TEST MODE: Simulating PayPal payment capture');
			
			// Extract booking ID from test order ID or find by orderId
			let booking;
			if (orderId.startsWith('TEST-')) {
				const bookingId = orderId.replace('TEST-', '');
				booking = getEventBooking(bookingId);
			} else {
				// Find by PayPal order ID
				const { getEventBookings } = await import('$lib/server/database');
				const bookings = getEventBookings();
				booking = bookings.find(b => b.paypalOrderId === orderId || b.id === orderId);
			}

			if (!booking) {
				return json({ error: 'Booking not found' }, { status: 404 });
			}

			// Get the amount from the booking (stored during order creation in TEST mode)
			let amountPaid = booking.testPaymentAmount;
			
			// If testPaymentAmount wasn't set, use full amount
			if (!amountPaid || amountPaid <= 0) {
				amountPaid = booking.totalAmount - (booking.paidAmount || 0);
			}
			
			// Clear testPaymentAmount after use
			if (booking.testPaymentAmount) {
				delete booking.testPaymentAmount;
			}

			// Update payment status (events only support full payment)
			booking.paidAmount = booking.totalAmount;
			booking.paymentStatus = 'paid';
			booking.paypalOrderId = orderId;
			booking.paypalOrderStatus = 'COMPLETED';
			booking.paypalCaptureId = `TEST-CAPTURE-${Date.now()}`;
			booking.paymentDate = new Date().toISOString();
			saveEventBooking(booking);

			console.log('🧪 TEST MODE: Payment simulated successfully', {
				bookingId: booking.id,
				paymentStatus: booking.paymentStatus,
				amountPaid
			});

			// Send notifications (don't wait for them)
			const event = getEvent(booking.eventId);
			if (event) {
				// Send admin notification (if function exists)
				try {
					const { getEventAttendees } = await import('$lib/server/database');
					const attendees = getEventAttendees(booking.id);
					
					// Resend confirmation email with payment status
					await sendEventBookingConfirmationEmail({
						booking,
						event,
						attendees
					});
				} catch (err) {
					console.error('Email notification failed:', err);
				}
			}

			return json({
				success: true,
				bookingId: booking.id,
				status: booking.paymentStatus,
				amountPaid
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
		const { getEventBookings } = await import('$lib/server/database');
		const bookings = getEventBookings();
		const booking = bookings.find(b => b.paypalOrderId === orderId);

		if (!booking) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}

		// Get payment details
		const purchaseUnit = captureResult.purchase_units[0];
		const payment = purchaseUnit.payments.captures[0];
		const amountPaid = parseFloat(payment.amount.value);

		// Update booking payment status (events only support full payment)
		booking.paidAmount = booking.totalAmount;
		booking.paymentStatus = 'paid';
		booking.paypalOrderId = orderId;
		booking.paypalOrderStatus = 'COMPLETED';
		booking.paypalCaptureId = payment.id;
		booking.paymentDate = new Date().toISOString();
		saveEventBooking(booking);

		// Send payment confirmation email
		try {
			const event = getEvent(booking.eventId);
			if (event) {
				const { getEventAttendees } = await import('$lib/server/database');
				const attendees = getEventAttendees(booking.id);
				
				await sendEventBookingConfirmationEmail({
					booking,
					event,
					attendees
				});
			}
		} catch (emailError) {
			console.error('Failed to send payment confirmation email:', emailError);
		}

		return json({
			success: true,
			bookingId: booking.id,
			status: booking.paymentStatus,
			amountPaid
		});
	} catch (error) {
		console.error('Failed to capture PayPal payment:', error);
		return json({ error: error.message || 'Failed to capture payment' }, { status: 500 });
	}
};

