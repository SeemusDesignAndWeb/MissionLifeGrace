import { env } from '$env/dynamic/private';

const PAYPAL_CLIENT_ID = env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';
const PAYPAL_WEBHOOK_ID = env.PAYPAL_WEBHOOK_ID || '';

// Get PayPal access token
async function getAccessToken() {
	if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
		throw new Error('PayPal credentials not configured');
	}

	const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

	const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
		method: 'POST',
		headers: {
			'Authorization': `Basic ${auth}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials'
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to get PayPal access token: ${error}`);
	}

	const data = await response.json();
	return data.access_token;
}

// Create PayPal order
export async function createPayPalOrder({ amount, currency = 'GBP', bookingId, bookingReference, description }) {
	try {
		const accessToken = await getAccessToken();

		const orderData = {
			intent: 'CAPTURE',
			purchase_units: [
				{
					reference_id: bookingId,
					description: description || `Conference Booking: ${bookingReference}`,
					amount: {
						currency_code: currency,
						value: amount.toFixed(2)
					},
					custom_id: bookingId
				}
			],
			application_context: {
				brand_name: 'Mission Life Grace',
				landing_page: 'BILLING',
				user_action: 'PAY_NOW',
				return_url: `${env.PUBLIC_SITE_URL || 'http://localhost:5173'}/conference/payment/success`,
				cancel_url: `${env.PUBLIC_SITE_URL || 'http://localhost:5173'}/conference/payment/cancel`
			}
		};

		const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'Prefer': 'return=representation'
			},
			body: JSON.stringify(orderData)
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to create PayPal order: ${error}`);
		}

		const order = await response.json();
		return order;
	} catch (error) {
		console.error('PayPal order creation error:', error);
		throw error;
	}
}

// Capture PayPal payment
export async function capturePayPalOrder(orderId) {
	try {
		const accessToken = await getAccessToken();

		const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'Prefer': 'return=representation'
			}
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to capture PayPal order: ${error}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('PayPal capture error:', error);
		throw error;
	}
}

// Get PayPal order details
export async function getPayPalOrder(orderId) {
	try {
		const accessToken = await getAccessToken();

		const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to get PayPal order: ${error}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('PayPal get order error:', error);
		throw error;
	}
}

// Verify PayPal webhook signature
export async function verifyWebhookSignature(headers, body, webhookId = PAYPAL_WEBHOOK_ID) {
	try {
		const accessToken = await getAccessToken();

		const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				transmission_id: headers['paypal-transmission-id'],
				transmission_time: headers['paypal-transmission-time'],
				cert_url: headers['paypal-cert-url'],
				auth_algo: headers['paypal-auth-algo'],
				transmission_sig: headers['paypal-transmission-sig'],
				webhook_id: webhookId,
				webhook_event: body
			})
		});

		if (!response.ok) {
			return false;
		}

		const data = await response.json();
		return data.verification_status === 'SUCCESS';
	} catch (error) {
		console.error('Webhook verification error:', error);
		return false;
	}
}

// Create PayPal order for installments (Pay in 3/4)
export async function createPayPalInstallmentOrder({ amount, currency = 'GBP', bookingId, bookingReference, description, installmentCount = 3 }) {
	try {
		const accessToken = await getAccessToken();

		// Calculate installment amount
		const installmentAmount = (amount / installmentCount).toFixed(2);

		const orderData = {
			intent: 'CAPTURE',
			purchase_units: [
				{
					reference_id: bookingId,
					description: description || `Conference Booking: ${bookingReference} (Installments)`,
					amount: {
						currency_code: currency,
						value: amount.toFixed(2),
						breakdown: {
							item_total: {
								currency_code: currency,
								value: amount.toFixed(2)
							}
						}
					},
					custom_id: bookingId,
					payment_instruction: {
						platform_fees: [],
						disbursement_mode: 'INSTANT'
					}
				}
			],
			payment_source: {
				paypal: {
					experience_context: {
						payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
						brand_name: 'Mission Life Grace',
						landing_page: 'BILLING',
						user_action: 'PAY_NOW',
						return_url: `${env.PUBLIC_SITE_URL || 'http://localhost:5173'}/conference/payment/success`,
						cancel_url: `${env.PUBLIC_SITE_URL || 'http://localhost:5173'}/conference/payment/cancel`
					}
				}
			}
		};

		const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'Prefer': 'return=representation'
			},
			body: JSON.stringify(orderData)
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to create PayPal installment order: ${error}`);
		}

		const order = await response.json();
		return order;
	} catch (error) {
		console.error('PayPal installment order creation error:', error);
		throw error;
	}
}

