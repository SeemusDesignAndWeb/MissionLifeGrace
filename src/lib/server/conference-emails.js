import { sendContactEmail } from './resend';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { getMlgLogoBase64 } from './logo';

const resend = new Resend(env.RESEND_API_KEY);

// Read MLG Logo as base64-encoded PNG
const MLG_LOGO_BASE64 = getMlgLogoBase64();

/**
 * Send booking confirmation email to group leader
 */
export async function sendBookingConfirmationEmail({ booking, conference, attendees }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:5173';

		// Generate ticket list HTML
		const ticketList = attendees.map(attendee => {
			const ticketType = attendees.find(a => a.ticketTypeId === attendee.ticketTypeId)?.ticketType || { name: 'N/A' };
			return `
				<tr>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${attendee.fullName}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${ticketType.name || 'N/A'}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${attendee.ticketId || 'Pending'}</td>
				</tr>
			`;
		}).join('');


		const emailHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #00a79d 0%, #0693ad 50%, #1384b6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
					<img src="data:image/png;base64,${MLG_LOGO_BASE64}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
					<h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>Dear ${booking.groupLeaderName},</p>
					<p>Thank you for registering for <strong>${conference.title}</strong>!</p>
					
					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Booking Details</h2>
						<p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
						<p><strong>Conference:</strong> ${conference.title}</p>
						<p><strong>Date:</strong> ${formatDateRange(conference.startDate, conference.endDate)}</p>
						<p><strong>Venue:</strong> ${conference.venue?.name || 'TBA'}</p>
						<p><strong>Total Amount:</strong> £${booking.totalAmount.toFixed(2)}</p>
						<p><strong>Payment Status:</strong> ${booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus === 'partial' ? 'Partial Payment' : 'Pending Payment'}</p>
					</div>

					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Attendees</h2>
						<table style="width: 100%; border-collapse: collapse;">
							<thead>
								<tr style="background: #f0f0f0;">
									<th style="padding: 8px; text-align: left; border-bottom: 2px solid #0693ad;">Name</th>
									<th style="padding: 8px; text-align: left; border-bottom: 2px solid #0693ad;">Ticket Type</th>
									<th style="padding: 8px; text-align: left; border-bottom: 2px solid #0693ad;">Ticket ID</th>
								</tr>
							</thead>
							<tbody>
								${ticketList}
							</tbody>
						</table>
					</div>

					${booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'partial' ? `
						<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
							<p style="margin: 0;"><strong>Payment Required:</strong> Please complete your payment to secure your booking.</p>
							${booking.paymentStatus === 'partial' ? `
								<p style="margin: 5px 0 0 0;">You have paid £${(booking.paidAmount || 0).toFixed(2)}. Balance due: £${((booking.totalAmount || 0) - (booking.paidAmount || 0)).toFixed(2)}</p>
							` : ''}
							<p style="margin: 10px 0 0 0;">An account has been created for you to manage your booking and make payments online. Check your email for verification instructions.</p>
							<p style="margin: 10px 0 0 0;"><a href="${siteUrl}/my-account/login" style="color: #0693ad; text-decoration: underline;">Access your account here</a></p>
						</div>
					` : ''}

					<p>If you have any questions, please don't hesitate to contact us.</p>
					<p>We look forward to seeing you at the conference!</p>
					<p>Best regards,<br>Mission Life Grace Team</p>
				</div>
			</body>
			</html>
		`;

		const result = await resend.emails.send({
			from: fromEmail,
			to: booking.groupLeaderEmail,
			subject: `Booking Confirmation: ${conference.title}`,
			html: emailHtml
		});

		console.log('Booking confirmation email sent:', result);
		return result;
	} catch (error) {
		console.error('Failed to send booking confirmation email:', error);
		throw error;
	}
}

/**
 * Send notification to child group leaders for child registrations
 */
export async function sendChildRegistrationNotification({ booking, conference, childAttendees, childGroupLeaders }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

		// Group children by age group
		const childrenByAgeGroup = {};
		childAttendees.forEach(child => {
			const ageGroup = getAgeGroup(child.age);
			if (!childrenByAgeGroup[ageGroup]) {
				childrenByAgeGroup[ageGroup] = [];
			}
			childrenByAgeGroup[ageGroup].push(child);
		});

		// Send email to each age group leader
		for (const [ageGroup, children] of Object.entries(childrenByAgeGroup)) {
			const groupLeaderEmail = childGroupLeaders[ageGroup];
			if (!groupLeaderEmail) continue;

			const childrenList = children.map(child => `
				<tr>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${child.fullName}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${child.age} years</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${child.allergies || 'None'}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${child.dietaryRestrictions || 'None'}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${child.emergencyContact?.name || 'N/A'}</td>
				</tr>
			`).join('');


			const emailHtml = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
				</head>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #00a79d 0%, #0693ad 50%, #1384b6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
						<img src="data:image/png;base64,${MLG_LOGO_BASE64}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
						<h2 style="color: white; margin: 0;">New Child Registration - ${ageGroup}</h2>
					</div>
					<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
						<p>New children have been registered for <strong>${conference.title}</strong> in the ${ageGroup} age group.</p>
					
					<h3>Children Details:</h3>
					<table style="width: 100%; border-collapse: collapse;">
						<thead>
							<tr style="background: #f0f0f0;">
								<th style="padding: 8px; text-align: left;">Name</th>
								<th style="padding: 8px; text-align: left;">Age</th>
								<th style="padding: 8px; text-align: left;">Allergies</th>
								<th style="padding: 8px; text-align: left;">Dietary</th>
								<th style="padding: 8px; text-align: left;">Emergency Contact</th>
							</tr>
						</thead>
						<tbody>
							${childrenList}
						</tbody>
					</table>

					<p><strong>Group Leader:</strong> ${booking.groupLeaderName} (${booking.groupLeaderEmail})</p>
					<p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
				</body>
				</html>
			`;

			await resend.emails.send({
				from: fromEmail,
				to: groupLeaderEmail,
				subject: `New Child Registration - ${conference.title}`,
				html: emailHtml
			});
		}
	} catch (error) {
		console.error('Failed to send child registration notification:', error);
		// Don't throw - this is a notification, not critical
	}
}

/**
 * Send email verification code to user
 */
export async function sendVerificationCodeEmail({ email, code, name }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:5173';


		const emailHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #00a79d 0%, #0693ad 50%, #1384b6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
					<img src="data:image/png;base64,${MLG_LOGO_BASE64}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
					<h1 style="color: white; margin: 0;">Email Verification</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>Dear ${name || 'User'},</p>
					<p>Thank you for creating an account to manage your conference booking.</p>
					
					<div style="background: white; padding: 30px; border-radius: 5px; margin: 20px 0; text-align: center; border: 2px solid #0693ad;">
						<p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification code is:</p>
						<h2 style="margin: 0; color: #0693ad; font-size: 36px; letter-spacing: 5px;">${code}</h2>
						<p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">This code will expire in 24 hours</p>
					</div>

					<p style="color: #666; font-size: 14px;">Enter this code on the verification page to complete your account setup.</p>
					
					<p>If you didn't request this code, please ignore this email.</p>
					<p>Best regards,<br>Mission Life Grace Team</p>
				</div>
			</body>
			</html>
		`;

		const result = await resend.emails.send({
			from: fromEmail,
			to: email,
			subject: 'Your Email Verification Code',
			html: emailHtml
		});

		console.log('Verification code email sent:', result);
		return result;
	} catch (error) {
		console.error('Failed to send verification code email:', error);
		throw error;
	}
}

/**
 * Send password reset email with token
 */
export async function sendPasswordResetEmail({ email, token }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:5173';

		// Use a link with token
		const resetLink = `${siteUrl}/my-account/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

		const emailHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #00a79d 0%, #0693ad 50%, #1384b6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
					<img src="data:image/png;base64,${MLG_LOGO_BASE64}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
					<h1 style="color: white; margin: 0;">Reset Your Password</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>Hello,</p>
					<p>We received a request to reset the password for your Mission Life Grace account.</p>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${resetLink}" style="background-color: #0693ad; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
					</div>

					<p style="margin-bottom: 5px;">Or copy and paste this link into your browser:</p>
					<p style="word-break: break-all; font-size: 12px; color: #666; background: white; padding: 10px; border-radius: 5px; border: 1px solid #eee;">
						${resetLink}
					</p>

					<p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
					
					<p>Best regards,<br>Mission Life Grace Team</p>
				</div>
			</body>
			</html>
		`;

		const result = await resend.emails.send({
			from: fromEmail,
			to: email,
			subject: 'Reset Your Password',
			html: emailHtml
		});

		console.log('Password reset email sent:', result);
		return result;
	} catch (error) {
		console.error('Failed to send password reset email:', error);
		throw error;
	}
}

function formatDateRange(startDate, endDate) {
	if (!startDate) return 'TBA';
	if (!endDate || startDate === endDate) {
		return new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
	const start = new Date(startDate);
	const end = new Date(endDate);
	if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
		return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
	}
	return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function getAgeGroup(age) {
	if (age <= 5) return '0-5 years';
	if (age <= 8) return '6-8 years';
	if (age <= 12) return '9-12 years';
	return 'Teen';
}
