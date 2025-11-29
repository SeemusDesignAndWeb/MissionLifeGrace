import { json } from '@sveltejs/kit';
import { verifyWebhookSignature } from '$lib/server/paypal';
import { getConferenceBooking, saveConferenceBooking, saveConferencePaymentSchedule, getConference } from '$lib/server/database';

export const POST = async ({ request }) => {
	try {
		const body = await request.json();
		const headers = Object.fromEntries(request.headers.entries());

		// Verify webhook signature
		const isValid = await verifyWebhookSignature(headers, body);
		if (!isValid) {
			console.warn('Invalid webhook signature');
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		const eventType = body.event_type;
		const resource = body.resource;

		// Handle different webhook events
		switch (eventType) {
			case 'PAYMENT.CAPTURE.COMPLETED':
				await handlePaymentCompleted(resource);
				break;
			case 'PAYMENT.CAPTURE.DENIED':
			case 'PAYMENT.CAPTURE.REFUNDED':
				await handlePaymentFailed(resource);
				break;
			default:
				console.log(`Unhandled webhook event: ${eventType}`);
		}

		return json({ received: true });
	} catch (error) {
		console.error('Webhook processing error:', error);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
};

async function handlePaymentCompleted(resource) {
	try {
		const customId = resource.custom_id || resource.purchase_units?.[0]?.custom_id;
		if (!customId) {
			console.warn('No custom_id in payment resource');
			return;
		}

		const booking = getConferenceBooking(customId);
		if (!booking) {
			console.warn(`Booking not found: ${customId}`);
			return;
		}

		const amountPaid = parseFloat(resource.amount?.value || 0);

		// Update booking payment status
		if (booking.paymentMethod === 'deposit' || booking.paymentMethod === 'installment') {
			booking.paymentStatus = 'partial';
			booking.paidAmount = (booking.paidAmount || 0) + amountPaid;
			
			// Create payment schedule if this is the first payment
			if (!booking.paidAmount || booking.paidAmount === amountPaid) {
				const conference = getConference(booking.conferenceId);
				if (conference?.paymentSettings) {
					const { installmentCount, installmentInterval } = conference.paymentSettings;
					const remainingAmount = booking.totalAmount - amountPaid;
					const installmentAmount = remainingAmount / (installmentCount - 1);
					
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
		} else {
			booking.paymentStatus = 'paid';
			booking.paidAmount = booking.totalAmount;
		}

		booking.paypalCaptureId = resource.id;
		booking.paymentDate = new Date().toISOString();
		saveConferenceBooking(booking);

		console.log(`Payment completed for booking ${booking.id}: ${amountPaid}`);
	} catch (error) {
		console.error('Error handling payment completed:', error);
	}
}

async function handlePaymentFailed(resource) {
	try {
		const customId = resource.custom_id || resource.purchase_units?.[0]?.custom_id;
		if (!customId) {
			return;
		}

		const booking = getConferenceBooking(customId);
		if (booking) {
			booking.paymentStatus = 'unpaid';
			saveConferenceBooking(booking);
			console.log(`Payment failed for booking ${booking.id}`);
		}
	} catch (error) {
		console.error('Error handling payment failed:', error);
	}
}

