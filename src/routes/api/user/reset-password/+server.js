import { json } from '@sveltejs/kit';
import { getUserAccountByEmail, getPasswordResetToken, markPasswordResetTokenUsed, saveUserAccount } from '$lib/server/database';
import { hashUserPassword } from '$lib/server/user-auth';

export const POST = async ({ request }) => {
	try {
		const { email, token, newPassword } = await request.json();

		if (!email || !token || !newPassword) {
			return json({ error: 'All fields are required' }, { status: 400 });
		}

		if (newPassword.length < 6) {
			return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		// Validate token
		const resetToken = getPasswordResetToken(email, token);
		if (!resetToken) {
			return json({ error: 'Invalid or expired reset token' }, { status: 400 });
		}

		const userAccount = getUserAccountByEmail(email);
		if (!userAccount) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Update password
		userAccount.passwordHash = hashUserPassword(newPassword);
		// Also mark as verified if they weren't already (as they accessed via email link)
		userAccount.verified = true; 
		saveUserAccount(userAccount);

		// Mark token as used
		markPasswordResetTokenUsed(email, token);

		return json({ success: true });
	} catch (error) {
		console.error('Reset password error:', error);
		return json({ error: 'Failed to reset password' }, { status: 500 });
	}
};

