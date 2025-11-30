import { json } from '@sveltejs/kit';
import {
	getUserAccountByEmail,
	saveUserAccount,
	saveEmailVerificationCode
} from '$lib/server/database';
import { hashUserPassword, generateVerificationCode } from '$lib/server/user-auth';
import { sendVerificationCodeEmail } from '$lib/server/conference-emails';

export const POST = async ({ request }) => {
	try {
		const { email, bookingId, name } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Check if account already exists
		const existingAccount = getUserAccountByEmail(email);
		if (existingAccount) {
			// If account exists but email not verified, resend code
			if (!existingAccount.emailVerified) {
				const verificationCode = generateVerificationCode();
				const verification = {
					email: email.toLowerCase(),
					code: verificationCode,
					used: false,
					createdAt: new Date().toISOString()
				};
				saveEmailVerificationCode(verification);
				
				try {
					await sendVerificationCodeEmail({
						email,
						code: verificationCode,
						name: name || 'User'
					});
				} catch (emailError) {
					console.error('Failed to send verification email:', emailError);
				}
				
				return json({
					success: true,
					message: 'Verification code sent. Please check your email.',
					userId: existingAccount.id
				});
			}
			// If account exists and is fully verified, don't allow re-registration
			if (existingAccount.verified && existingAccount.passwordHash) {
				return json({ error: 'An account with this email already exists' }, { status: 400 });
			}
			// If email verified but no password, allow resending code (shouldn't happen but handle it)
			const verificationCode = generateVerificationCode();
			const verification = {
				email: email.toLowerCase(),
				code: verificationCode,
				used: false,
				createdAt: new Date().toISOString()
			};
			saveEmailVerificationCode(verification);
			
			try {
				await sendVerificationCodeEmail({
					email,
					code: verificationCode,
					name: name || 'User'
				});
			} catch (emailError) {
				console.error('Failed to send verification email:', emailError);
			}
			
			return json({
				success: true,
				message: 'Verification code sent. Please check your email.',
				userId: existingAccount.id
			});
		}

		// Generate verification code
		const verificationCode = generateVerificationCode();

		// Create user account (not verified yet, no password yet)
		const userAccount = {
			id: `user-${Date.now()}`,
			email: email.toLowerCase(),
			passwordHash: null, // Password will be set after email verification
			verified: false,
			bookingIds: bookingId ? [bookingId] : [],
			createdAt: new Date().toISOString()
		};

		saveUserAccount(userAccount);

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
				name: name || 'User'
			});
		} catch (emailError) {
			console.error('Failed to send verification email:', emailError);
			// Don't fail registration if email fails
		}

		return json({
			success: true,
			message: 'Please check your email for the verification code.',
			userId: userAccount.id
		});
	} catch (error) {
		console.error('Failed to register user:', error);
		return json({ error: 'Failed to create account' }, { status: 500 });
	}
};


