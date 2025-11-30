import { json } from '@sveltejs/kit';
import { getUserAccountByEmail } from '$lib/server/database';

export const GET = async ({ url }) => {
	try {
		const email = url.searchParams.get('email');
		
		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		const userAccount = getUserAccountByEmail(email);
		
		if (!userAccount) {
			return json({ exists: false });
		}

		return json({
			exists: true,
			verified: userAccount.verified || false,
			email: userAccount.email
		});
	} catch (error) {
		console.error('Failed to check account:', error);
		return json({ error: 'Failed to check account' }, { status: 500 });
	}
};


