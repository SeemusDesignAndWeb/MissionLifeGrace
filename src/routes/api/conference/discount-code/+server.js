import { json } from '@sveltejs/kit';
import { getConferenceDiscountCode } from '$lib/server/database';

export const GET = async ({ url }) => {
	try {
		const code = url.searchParams.get('code');
		const conferenceId = url.searchParams.get('conferenceId');
		
		if (!code) {
			return json({ error: 'Code required' }, { status: 400 });
		}
		
		const discountCode = getConferenceDiscountCode(code, conferenceId);
		
		if (!discountCode || !discountCode.enabled) {
			return json({ error: 'Invalid or disabled discount code' }, { status: 404 });
		}
		
		// Check expiry
		if (discountCode.expiryDate && new Date(discountCode.expiryDate) < new Date()) {
			return json({ error: 'Discount code has expired' }, { status: 400 });
		}
		
		// Check usage limit
		if (discountCode.maxUsage > 0 && (discountCode.usedCount || 0) >= discountCode.maxUsage) {
			return json({ error: 'Discount code has reached its usage limit' }, { status: 400 });
		}
		
		return json(discountCode);
	} catch (error) {
		return json({ error: 'Failed to validate discount code' }, { status: 500 });
	}
};

