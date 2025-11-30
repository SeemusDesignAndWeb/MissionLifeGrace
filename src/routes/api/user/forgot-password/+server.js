import { json } from '@sveltejs/kit';
import { getUserAccountByEmail, savePasswordResetToken } from '$lib/server/database';
import { sendPasswordResetEmail } from '$lib/server/conference-emails';
import { randomBytes } from 'crypto';

export const POST = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		const userAccount = getUserAccountByEmail(email);

		if (!userAccount) {
			// Don't reveal that the account doesn't exist for security reasons
			// Simulate a delay to match processing time
			await new Promise(resolve => setTimeout(resolve, 500));
			return json({ success: true });
		}

		// Generate a secure random token
		const token = randomBytes(32).toString('hex');

		// Save token
		savePasswordResetToken({
			email: userAccount.email,
			token,
			createdAt: new Date().toISOString(),
			used: false
		});

		// Send email
		await sendPasswordResetEmail({
			email: userAccount.email,
			token
		});

		return json({ success: true });
	} catch (error) {
		console.error('Forgot password error:', error);
		return json({ error: 'Failed to process request' }, { status: 500 });
	}
};

