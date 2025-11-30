import { json } from '@sveltejs/kit';
import {
	getUserAccount,
	saveUserAccount
} from '$lib/server/database';
import { hashUserPassword, verifyPassword, getUserId } from '$lib/server/user-auth';

export const POST = async ({ request, cookies }) => {
	try {
		const { currentPassword, newPassword } = await request.json();

		if (!currentPassword || !newPassword) {
			return json({ error: 'Current password and new password are required' }, { status: 400 });
		}

		if (newPassword.length < 6) {
			return json({ error: 'New password must be at least 6 characters' }, { status: 400 });
		}

		// Get user ID from session
		const userId = getUserId(cookies);
		if (!userId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Get user account
		const userAccount = getUserAccount(userId);
		if (!userAccount) {
			return json({ error: 'User account not found' }, { status: 404 });
		}

		// Verify current password
		if (!userAccount.passwordHash || !verifyPassword(currentPassword, userAccount.passwordHash)) {
			return json({ error: 'Current password is incorrect' }, { status: 401 });
		}

		// Check if new password is different
		if (verifyPassword(newPassword, userAccount.passwordHash)) {
			return json({ error: 'New password must be different from current password' }, { status: 400 });
		}

		// Update password
		userAccount.passwordHash = hashUserPassword(newPassword);
		userAccount.passwordChangedAt = new Date().toISOString();
		saveUserAccount(userAccount);

		return json({
			success: true,
			message: 'Password changed successfully'
		});
	} catch (error) {
		console.error('Failed to change password:', error);
		return json({ error: 'Failed to change password' }, { status: 500 });
	}
};

