import { json } from '@sveltejs/kit';
import { createPayPalOrder, createPayPalInstallmentOrder } from '$lib/server/paypal';
import { getConferenceBooking, saveConferenceBooking } from '$lib/server/database';

export const POST = async ({ request }) => {
	try {
		const { bookingId, paymentMethod } = await request.json();

		if (!bookingId) {
			return json({ error: 'Booking ID is required' }, { status: 400 });
		}

		// Get booking
		const booking = getConferenceBooking(bookingId);
		if (!booking) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}

		// Determine if this is installment payment
		const isInstallment = paymentMethod === 'deposit' || paymentMethod === 'installment';
		
		// Get conference to check payment settings
		const { getConference } = await import('$lib/server/database');
		const conference = booking.conferenceId ? getConference(booking.conferenceId) : null;
		
		// Calculate amount based on payment method
		let amount = booking.totalAmount;
		if (isInstallment && conference?.paymentSettings) {
			if (conference.paymentSettings.depositAmount) {
				amount = conference.paymentSettings.depositAmount;
			} else if (conference.paymentSettings.depositPercentage) {
				amount = booking.totalAmount * (conference.paymentSettings.depositPercentage / 100);
			}
		}

		// Create PayPal order
		let order;
		if (isInstallment) {
			const installmentCount = conference?.paymentSettings?.installmentCount || 3;
			
			order = await createPayPalInstallmentOrder({
				amount,
				currency: 'GBP',
				bookingId: booking.id,
				bookingReference: booking.bookingReference,
				description: `Conference Booking Deposit: ${booking.bookingReference}`,
				installmentCount
			});
		} else {
			order = await createPayPalOrder({
				amount,
				currency: 'GBP',
				bookingId: booking.id,
				bookingReference: booking.bookingReference,
				description: `Conference Booking: ${booking.bookingReference}`
			});
		}

		// Update booking with PayPal order ID
		booking.paypalOrderId = order.id;
		booking.paypalOrderStatus = order.status;
		saveConferenceBooking(booking);

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

