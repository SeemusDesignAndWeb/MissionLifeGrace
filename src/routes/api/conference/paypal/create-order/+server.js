import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createPayPalOrder, createPayPalInstallmentOrder } from '$lib/server/paypal';
import { getConferenceBooking, saveConferenceBooking } from '$lib/server/database';

export const POST = async ({ request }) => {
	try {
		const { bookingId, paymentMethod, amount } = await request.json();

		// TEST mode: Return fake PayPal order
		if (env.TEST === 'true') {
			console.log('🧪 TEST MODE: Bypassing PayPal order creation');
			const booking = getConferenceBooking(bookingId);
			if (!booking) {
				return json({ error: 'Booking not found' }, { status: 404 });
			}

			// Calculate amount (same logic as below)
			let paymentAmount = booking.totalAmount;
			if (amount && typeof amount === 'number' && amount > 0) {
				const balanceDue = booking.totalAmount - (booking.paidAmount || 0);
				if (amount > balanceDue) {
					return json({ error: 'Payment amount cannot exceed balance due' }, { status: 400 });
				}
				paymentAmount = amount;
			} else if (paymentMethod === 'deposit20') {
				paymentAmount = booking.totalAmount * 0.2;
			} else if (paymentMethod === 'full' || !paymentMethod) {
				paymentAmount = booking.totalAmount - (booking.paidAmount || 0);
			}

			// Store the payment amount in booking for TEST mode capture
			booking.testPaymentAmount = paymentAmount;
			saveConferenceBooking(booking);

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
		const booking = getConferenceBooking(bookingId);
		if (!booking) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}

		// Determine if this is installment payment
		const isInstallment = paymentMethod === 'deposit' || paymentMethod === 'installment';
		const isDeposit20 = paymentMethod === 'deposit20';
		
		// Get conference to check payment settings
		const { getConference } = await import('$lib/server/database');
		const conference = booking.conferenceId ? getConference(booking.conferenceId) : null;
		
		// Calculate amount based on payment method
		let paymentAmount = booking.totalAmount;
		
		// If custom amount is provided, use it (for partial payments)
		if (amount && typeof amount === 'number' && amount > 0) {
			const balanceDue = booking.totalAmount - (booking.paidAmount || 0);
			if (amount > balanceDue) {
				return json({ error: 'Payment amount cannot exceed balance due' }, { status: 400 });
			}
			paymentAmount = amount;
		} else if (isDeposit20) {
			// 20% deposit
			paymentAmount = booking.totalAmount * 0.2;
		} else if (isInstallment && conference?.paymentSettings) {
			if (conference.paymentSettings.depositAmount) {
				paymentAmount = conference.paymentSettings.depositAmount;
			} else if (conference.paymentSettings.depositPercentage) {
				paymentAmount = booking.totalAmount * (conference.paymentSettings.depositPercentage / 100);
			}
		} else if (paymentMethod === 'full' || !paymentMethod) {
			// Pay remaining balance for full payment
			paymentAmount = booking.totalAmount - (booking.paidAmount || 0);
		}

		// Create PayPal order
		let order;
		const paymentDescription = amount && paymentAmount < (booking.totalAmount - (booking.paidAmount || 0))
			? `Conference Booking Partial Payment: ${booking.bookingReference}`
			: `Conference Booking: ${booking.bookingReference}`;

		if (isDeposit20) {
			// 20% deposit - single payment, no installments
			order = await createPayPalOrder({
				amount: paymentAmount,
				currency: 'GBP',
				bookingId: booking.id,
				bookingReference: booking.bookingReference,
				description: `Conference Booking 20% Deposit: ${booking.bookingReference}`
			});
		} else if (isInstallment) {
			const installmentCount = conference?.paymentSettings?.installmentCount || 3;
			
			order = await createPayPalInstallmentOrder({
				amount: paymentAmount,
				currency: 'GBP',
				bookingId: booking.id,
				bookingReference: booking.bookingReference,
				description: `Conference Booking Deposit: ${booking.bookingReference}`,
				installmentCount
			});
		} else {
			order = await createPayPalOrder({
				amount: paymentAmount,
				currency: 'GBP',
				bookingId: booking.id,
				bookingReference: booking.bookingReference,
				description: paymentDescription
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

