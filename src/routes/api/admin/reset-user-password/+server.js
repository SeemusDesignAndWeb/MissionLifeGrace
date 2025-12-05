import { json } from '@sveltejs/kit';
import { 
	getUserAccountByEmail,
	getUserAccount,
	saveUserAccount,
	savePasswordResetToken
} from '$lib/server/database';
import { requireAccessLevel, ACCESS_LEVELS } from '$lib/server/admin-auth';
import { hashUserPassword } from '$lib/server/user-auth';
import { sendPasswordResetEmail } from '$lib/server/conference-emails';
import crypto from 'crypto';

/**
 * POST - Reset a user's booking password (admin only)
 * Requires: Conference Access level or higher
 * 
 * Body: { email: string, sendEmail: boolean (optional) }
 * 
 * If sendEmail is true, sends a password reset email to the user
 * If sendEmail is false or not provided, generates a new password and returns it
 */
export const POST = async (event) => {
	requireAccessLevel(event, ACCESS_LEVELS.CONFERENCE_ACCESS);
	
	try {
		const { email, sendEmail = false } = await event.request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Get user account
		const userAccount = getUserAccountByEmail(email);
		if (!userAccount) {
			return json({ error: 'User account not found' }, { status: 404 });
		}

		// Generate a secure random password
		const newPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
		
		// Hash and save the new password
		userAccount.passwordHash = hashUserPassword(newPassword);
		userAccount.updatedAt = new Date().toISOString();
		saveUserAccount(userAccount);

		// If sendEmail is true, send password reset email
		if (sendEmail) {
			try {
				// Generate a reset token for the email
				const resetToken = crypto.randomBytes(32).toString('hex');
				const tokenData = {
					email: userAccount.email.toLowerCase(),
					token: resetToken,
					used: false,
					createdAt: new Date().toISOString()
				};
				
				// Save the token
				savePasswordResetToken(tokenData);
				
				// Send the password reset email
				await sendPasswordResetEmail({ 
					email: userAccount.email, 
					token: resetToken 
				});
				
				return json({ 
					success: true, 
					message: 'Password reset email sent successfully',
					emailSent: true
				});
			} catch (emailError) {
				console.error('Failed to send password reset email:', emailError);
				// Still return success since password was reset, but note email failed
				return json({ 
					success: true, 
					message: 'Password reset successfully, but failed to send email',
					emailSent: false,
					newPassword: newPassword // Return password so admin can share it manually
				});
			}
		}

		// Return the new password if not sending email
		return json({ 
			success: true, 
			message: 'Password reset successfully',
			newPassword: newPassword,
			emailSent: false
		});

	} catch (error) {
		console.error('Reset user password error:', error);
		return json({ error: error.message || 'Failed to reset password' }, { status: 500 });
	}
};

