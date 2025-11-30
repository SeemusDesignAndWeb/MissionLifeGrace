import { json } from '@sveltejs/kit';
import {
	getUserAccountByEmail,
	saveEmailVerificationCode
} from '$lib/server/database';
import { generateVerificationCode } from '$lib/server/user-auth';
import { sendVerificationCodeEmail } from '$lib/server/conference-emails';

export const POST = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Get user account
		const userAccount = getUserAccountByEmail(email);
		if (!userAccount) {
			return json({ error: 'Account not found' }, { status: 404 });
		}

		// Check if already verified
		if (userAccount.verified) {
			return json({ error: 'Email is already verified' }, { status: 400 });
		}

		// Generate new verification code
		const verificationCode = generateVerificationCode();

		// Save verification code
		const verification = {
			email: email.toLowerCase(),
			code: verificationCode,
			used: false,
			createdAt: new Date().toISOString()
		};
		saveEmailVerificationCode(verification);

		// Send verification email
		try {
			await sendVerificationCodeEmail({
				email,
				code: verificationCode,
				name: userAccount.name || 'User'
			});
		} catch (emailError) {
			console.error('Failed to send verification email:', emailError);
			return json({ error: 'Failed to send verification email' }, { status: 500 });
		}

		return json({
			success: true,
			message: 'Verification code sent to your email'
		});
	} catch (error) {
		console.error('Failed to resend verification code:', error);
		return json({ error: 'Failed to resend verification code' }, { status: 500 });
	}
};


