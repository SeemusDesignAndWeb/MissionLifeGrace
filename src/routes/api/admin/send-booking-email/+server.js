import { json } from '@sveltejs/kit';
import { getConferenceBookings, getConference } from '$lib/server/database';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { isAuthenticated } from '$lib/server/admin-auth';

const resend = new Resend(env.RESEND_API_KEY);

export const POST = async ({ request, cookies }) => {
	try {
		// Check admin authentication
		if (!isAuthenticated(cookies)) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { bookingId, subject, message } = await request.json();

		if (!bookingId) {
			return json({ error: 'Booking ID is required' }, { status: 400 });
		}

		if (!subject || !message) {
			return json({ error: 'Subject and message are required' }, { status: 400 });
		}

		const bookings = getConferenceBookings();
		const booking = bookings.find(b => b.id === bookingId);

		if (!booking) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}

		if (!booking.groupLeaderEmail) {
			return json({ error: 'No email address for group leader' }, { status: 400 });
		}

		const conference = getConference(booking.conferenceId);
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;

		// Replace placeholders
		let personalizedMessage = message
			.replace(/{bookingReference}/g, booking.bookingReference || 'N/A')
			.replace(/{groupLeaderName}/g, booking.groupLeaderName || 'Valued Customer');

		let personalizedSubject = subject
			.replace(/{bookingReference}/g, booking.bookingReference || 'N/A')
			.replace(/{groupLeaderName}/g, booking.groupLeaderName || 'Valued Customer');

		const emailHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #00a79d 0%, #0693ad 50%, #1384b6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
					<img src="${logoUrl}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
					<h1 style="color: white; margin: 0;">${personalizedSubject}</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>Dear ${booking.groupLeaderName},</p>
					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; white-space: pre-wrap;">${personalizedMessage.replace(/\n/g, '<br>')}</div>
					${conference ? `
						<div style="background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0693ad;">
							<p style="margin: 0; font-size: 14px;"><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
							<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Conference:</strong> ${conference.title}</p>
						</div>
					` : ''}
					<p>If you have any questions, please don't hesitate to contact us.</p>
					<p>Best regards,<br>Mission Life Grace Team</p>
				</div>
			</body>
			</html>
		`;

		await resend.emails.send({
			from: fromEmail,
			to: booking.groupLeaderEmail,
			subject: personalizedSubject,
			html: emailHtml
		});

		return json({ success: true });

	} catch (error) {
		console.error('Email error:', error);
		return json({ error: error.message || 'Failed to send email' }, { status: 500 });
	}
};

