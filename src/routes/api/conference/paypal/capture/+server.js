import { json } from '@sveltejs/kit';
import { capturePayPalOrder, getPayPalOrder } from '$lib/server/paypal';
import { getConferenceBooking, saveConferenceBooking, saveConferencePaymentSchedule, getConference } from '$lib/server/database';

export const POST = async ({ request }) => {
	try {
		const { orderId } = await request.json();

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
		if (booking.paymentMethod === 'deposit' || booking.paymentMethod === 'installment') {
			// This is a deposit payment
			booking.paymentStatus = 'partial';
			booking.paidAmount = (booking.paidAmount || 0) + amountPaid;
			
			// Create payment schedule for installments
			const conference = getConference(booking.conferenceId);
			if (conference?.paymentSettings) {
				const { installmentCount, installmentInterval, depositAmount, depositPercentage } = conference.paymentSettings;
				
				// Calculate remaining amount
				const remainingAmount = booking.totalAmount - amountPaid;
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
		} else {
			// Full payment
			booking.paymentStatus = 'paid';
			booking.paidAmount = booking.totalAmount;
		}

		booking.paypalOrderStatus = captureResult.status;
		booking.paypalCaptureId = payment.id;
		booking.paymentDate = new Date().toISOString();
		saveConferenceBooking(booking);

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

