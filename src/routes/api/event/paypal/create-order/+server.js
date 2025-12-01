import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createPayPalOrder } from '$lib/server/paypal';
import { getEventBooking, saveEventBooking } from '$lib/server/database';

export const POST = async ({ request }) => {
	try {
		const { bookingId } = await request.json();

		// TEST mode: Return fake PayPal order
		if (env.TEST === 'true') {
			console.log('🧪 TEST MODE: Bypassing PayPal order creation');
			const booking = getEventBooking(bookingId);
			if (!booking) {
				return json({ error: 'Booking not found' }, { status: 404 });
			}

			// Calculate payment amount (full payment for events)
			const paymentAmount = booking.totalAmount - (booking.paidAmount || 0);

			// Store the payment amount in booking for TEST mode capture
			booking.testPaymentAmount = paymentAmount;
			saveEventBooking(booking);

			// Return fake order data
			return json({
				orderId: `TEST-${bookingId}`,
				status: 'APPROVED',
				links: [
					{
						href: '#',
						rel: 'approve',
						method: 'GET'
					}
				]
			});
		}

		if (!bookingId) {
			return json({ error: 'Booking ID is required' }, { status: 400 });
		}

		// Get booking
		const booking = getEventBooking(bookingId);
		if (!booking) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}

		// Calculate payment amount (full payment for events)
		const paymentAmount = booking.totalAmount - (booking.paidAmount || 0);

		if (paymentAmount <= 0) {
			return json({ error: 'No payment required' }, { status: 400 });
		}

		// Get event to construct return URL
		const { getEvent } = await import('$lib/server/database');
		const event = getEvent(booking.eventId);
		const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:5173';
		const returnUrl = `${siteUrl}/events/${booking.eventId}`;
		const cancelUrl = `${siteUrl}/events/${booking.eventId}`;

		// Create PayPal order
		const order = await createPayPalOrder({
			amount: paymentAmount,
			currency: 'GBP',
			bookingId: booking.id,
			bookingReference: booking.bookingReference,
			description: `Event Booking: ${booking.bookingReference}`,
			returnUrl,
			cancelUrl
		});

		// Update booking with PayPal order ID
		booking.paypalOrderId = order.id;
		booking.paypalOrderStatus = order.status;
		saveEventBooking(booking);

		// Return order details for frontend
		return json({
			orderId: order.id,
			status: order.status,
			links: order.links
		});
	} catch (error) {
		console.error('Failed to create PayPal order:', error);
		return json({ error: error.message || 'Failed to create PayPal order' }, { status: 500 });
	}
};

