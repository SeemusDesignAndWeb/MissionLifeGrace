import { json } from '@sveltejs/kit';
import {
	getUserAccountByEmail,
	saveUserAccount
} from '$lib/server/database';
import { hashUserPassword, createUserSession } from '$lib/server/user-auth';

export const POST = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		// Get user account
		const userAccount = getUserAccountByEmail(email);
		if (!userAccount) {
			return json({ error: 'User account not found' }, { status: 404 });
		}

		// Check if email is verified
		if (!userAccount.emailVerified) {
			return json({ error: 'Email must be verified before setting password' }, { status: 400 });
		}

		// Set password
		userAccount.passwordHash = hashUserPassword(password);
		userAccount.verified = true; // Now fully verified
		userAccount.verifiedAt = new Date().toISOString();
		saveUserAccount(userAccount);

		// Create session
		createUserSession(cookies, userAccount.id);

		return json({
			success: true,
			message: 'Password set successfully. You are now logged in.',
			userId: userAccount.id
		});
	} catch (error) {
		console.error('Failed to set password:', error);
		return json({ error: 'Failed to set password' }, { status: 500 });
	}
};

