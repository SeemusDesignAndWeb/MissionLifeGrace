import { json } from '@sveltejs/kit';
import {
	getUserAccountByEmail
} from '$lib/server/database';
import { verifyPassword, createUserSession } from '$lib/server/user-auth';

export const POST = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Get user account
		const userAccount = getUserAccountByEmail(email);
		if (!userAccount) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		// Check if email is verified
		if (!userAccount.emailVerified) {
			return json({ 
				error: 'Please verify your email address first. Check your email for the verification code.',
				needsVerification: true
			}, { status: 401 });
		}

		// Check if password is set
		if (!userAccount.passwordHash) {
			return json({ 
				error: 'Please set your password first. Check your email for the setup link.',
				needsPassword: true
			}, { status: 401 });
		}

		// Verify password
		if (!verifyPassword(password, userAccount.passwordHash)) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		// Ensure account is fully verified
		if (!userAccount.verified) {
			userAccount.verified = true;
			userAccount.verifiedAt = new Date().toISOString();
			const { saveUserAccount } = await import('$lib/server/database');
			saveUserAccount(userAccount);
		}

		// Create session
		createUserSession(cookies, userAccount.id);

		return json({
			success: true,
			message: 'Logged in successfully',
			userId: userAccount.id
		});
	} catch (error) {
		console.error('Failed to login user:', error);
		return json({ error: 'Failed to login' }, { status: 500 });
	}
};


