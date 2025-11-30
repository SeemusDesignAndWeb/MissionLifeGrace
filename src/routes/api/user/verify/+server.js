import { json } from '@sveltejs/kit';
import {
	getUserAccountByEmail,
	saveUserAccount,
	getEmailVerificationCode,
	saveEmailVerificationCode
} from '$lib/server/database';
import { createUserSession } from '$lib/server/user-auth';

export const POST = async ({ request, cookies }) => {
	try {
		const { email, code } = await request.json();

		if (!email || !code) {
			return json({ error: 'Email and verification code are required' }, { status: 400 });
		}

		// Get verification code
		const verification = getEmailVerificationCode(email, code);
		if (!verification) {
			return json({ error: 'Invalid or expired verification code' }, { status: 400 });
		}

		// Check if code is already used
		if (verification.used) {
			return json({ error: 'This verification code has already been used' }, { status: 400 });
		}

		// Check if code is expired (24 hours)
		const codeAge = Date.now() - new Date(verification.createdAt).getTime();
		if (codeAge > 24 * 60 * 60 * 1000) {
			return json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
		}

		// Get user account
		const userAccount = getUserAccountByEmail(email);
		if (!userAccount) {
			return json({ error: 'User account not found' }, { status: 404 });
		}

		// Mark code as used
		verification.used = true;
		saveEmailVerificationCode(verification);

		// Verify email (but don't create session yet - password needs to be set first)
		userAccount.emailVerified = true;
		userAccount.emailVerifiedAt = new Date().toISOString();
		// Keep verified: false until password is set
		userAccount.verified = false;
		saveUserAccount(userAccount);

		// Don't create session yet - user needs to set password first
		// Always return needsPassword: true since password hasn't been set yet
		return json({
			success: true,
			message: 'Email verified successfully. Please set your password.',
			userId: userAccount.id,
			needsPassword: true // Always true at this point since password is set in next step
		});
	} catch (error) {
		console.error('Failed to verify email:', error);
		return json({ error: 'Failed to verify email' }, { status: 500 });
	}
};


