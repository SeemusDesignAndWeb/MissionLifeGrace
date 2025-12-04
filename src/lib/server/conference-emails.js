import { sendContactEmail } from './resend';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send booking confirmation email to group leader
 */
export async function sendBookingConfirmationEmail({ booking, conference, attendees, accountCreated = false }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;

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
					<img src="${logoUrl}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
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
							${accountCreated ? `
								<p style="margin: 10px 0 0 0;"><strong>Account Created:</strong> An account has been created for you to manage your booking and make payments online. Check your email for a verification code to complete your account setup.</p>
								<p style="margin: 10px 0 0 0;"><a href="${siteUrl}/my-account/login" style="color: #0693ad; text-decoration: underline;">Access your account here</a></p>
							` : `
								<p style="margin: 10px 0 0 0;">You can create an account to manage your booking and make payments online. Check your email for instructions or visit the booking page to set up your account.</p>
								<p style="margin: 10px 0 0 0;"><a href="${siteUrl}/my-account/login" style="color: #0693ad; text-decoration: underline;">Create or access your account here</a></p>
							`}
						</div>
					` : ''}

					${conference.startDate ? `
						<div style="text-align: center; margin: 30px 0;">
							<a href="${generateCalendarLink(conference)}" style="background-color: #0693ad; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Add to Calendar</a>
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
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;

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
						<img src="${logoUrl}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
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
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;

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
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;

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
					<img src="${logoUrl}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
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

/**
 * Generate Google Calendar link for conference
 */
function generateCalendarLink(conference) {
	if (!conference.startDate) return '';
	
	const startDate = new Date(conference.startDate);
	const endDate = conference.endDate ? new Date(conference.endDate) : new Date(startDate);
	// Add time if not specified (default to 9 AM start, 5 PM end)
	if (!conference.startTime) {
		startDate.setHours(9, 0, 0);
	} else {
		const [hours, minutes] = conference.startTime.split(':');
		startDate.setHours(parseInt(hours), parseInt(minutes || 0), 0);
	}
	
	if (!conference.endTime) {
		endDate.setHours(17, 0, 0);
	} else {
		const [hours, minutes] = conference.endTime.split(':');
		endDate.setHours(parseInt(hours), parseInt(minutes || 0), 0);
	}

	// Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
	const formatDate = (date) => {
		return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
	};

	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: conference.title,
		dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
		details: conference.description || '',
		location: conference.venue?.name || conference.venue?.address || ''
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Get admin email addresses from environment or use default
 */
function getAdminEmails() {
	const adminEmail = env.ADMIN_EMAIL || env.RESEND_EMAIL || 'enquiries@egcc.co.uk';
	// Support multiple admin emails (comma-separated)
	return adminEmail.split(',').map(email => email.trim()).filter(Boolean);
}

/**
 * Send admin notification when a new booking is created
 */
export async function sendAdminBookingNotification({ booking, conference, attendees }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;
		const adminEmails = getAdminEmails();

		// Generate attendee summary
		const attendeeSummary = attendees.map(attendee => {
			const ticketType = attendees.find(a => a.ticketTypeId === attendee.ticketTypeId)?.ticketType || { name: 'N/A' };
			return `
				<tr>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${attendee.fullName}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${ticketType.name || 'N/A'}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${attendee.email || 'N/A'}</td>
				</tr>
			`;
		}).join('');

		const paymentStatusBadge = booking.paymentStatus === 'paid' 
			? '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Paid</span>'
			: booking.paymentStatus === 'partial'
			? '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Partial</span>'
			: '<span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Unpaid</span>';

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
					<h1 style="color: white; margin: 0;">New Booking Received</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>A new booking has been received for <strong>${conference.title}</strong>.</p>
					
					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Booking Summary</h2>
						<p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
						<p><strong>Conference:</strong> ${conference.title}</p>
						<p><strong>Date:</strong> ${formatDateRange(conference.startDate, conference.endDate)}</p>
						<p><strong>Group Leader:</strong> ${booking.groupLeaderName}</p>
						<p><strong>Email:</strong> ${booking.groupLeaderEmail}</p>
						<p><strong>Phone:</strong> ${booking.groupLeaderPhone || 'N/A'}</p>
						<p><strong>Total Amount:</strong> £${booking.totalAmount.toFixed(2)}</p>
						<p><strong>Payment Status:</strong> ${paymentStatusBadge}</p>
						${booking.paymentStatus === 'partial' ? `<p><strong>Paid Amount:</strong> £${(booking.paidAmount || 0).toFixed(2)}</p><p><strong>Balance Due:</strong> £${((booking.totalAmount || 0) - (booking.paidAmount || 0)).toFixed(2)}</p>` : ''}
						<p><strong>Attendee Count:</strong> ${booking.attendeeCount || attendees.length}</p>
						<p><strong>Booking Date:</strong> ${formatDateRange(booking.createdAt, booking.createdAt)}</p>
					</div>

					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Attendees</h2>
						<table style="width: 100%; border-collapse: collapse;">
							<thead>
								<tr style="background: #f0f0f0;">
									<th style="padding: 8px; text-align: left; border-bottom: 2px solid #0693ad;">Name</th>
									<th style="padding: 8px; text-align: left; border-bottom: 2px solid #0693ad;">Ticket Type</th>
									<th style="padding: 8px; text-align: left; border-bottom: 2px solid #0693ad;">Email</th>
								</tr>
							</thead>
							<tbody>
								${attendeeSummary}
							</tbody>
						</table>
					</div>

					<div style="text-align: center; margin: 30px 0;">
						<a href="${siteUrl}/admin/conferences/bookings?booking=${booking.id}" style="background-color: #0693ad; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Booking Details</a>
					</div>

					<p style="color: #666; font-size: 14px; margin-top: 20px;">This is an automated notification from the MLG Conference Booking System.</p>
				</div>
			</body>
			</html>
		`;

		// Send to all admin emails
		const results = [];
		for (const adminEmail of adminEmails) {
			try {
				const result = await resend.emails.send({
					from: fromEmail,
					to: adminEmail,
					subject: `New Booking: ${booking.bookingReference} - ${conference.title}`,
					html: emailHtml
				});
				results.push(result);
			} catch (error) {
				console.error(`Failed to send admin notification to ${adminEmail}:`, error);
			}
		}

		console.log('Admin booking notification sent:', results);
		return results;
	} catch (error) {
		console.error('Failed to send admin booking notification:', error);
		// Don't throw - admin notifications shouldn't fail the booking
	}
}

/**
 * Send admin notification when a payment is received
 */
export async function sendAdminPaymentNotification({ booking, conference, paymentAmount, paymentMethod }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;
		const adminEmails = getAdminEmails();

		const balanceDue = (booking.totalAmount || 0) - (booking.paidAmount || 0);
		const paymentStatusBadge = booking.paymentStatus === 'paid' 
			? '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Fully Paid</span>'
			: '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Partial Payment</span>';

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
					<h1 style="color: white; margin: 0;">Payment Received</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>A payment has been received for booking <strong>${booking.bookingReference}</strong>.</p>
					
					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Payment Details</h2>
						<p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
						<p><strong>Conference:</strong> ${conference.title}</p>
						<p><strong>Group Leader:</strong> ${booking.groupLeaderName} (${booking.groupLeaderEmail})</p>
						<p><strong>Amount Received:</strong> £${paymentAmount.toFixed(2)}</p>
						<p><strong>Payment Method:</strong> ${paymentMethod || 'PayPal'}</p>
						<p><strong>Payment Date:</strong> ${formatDateRange(booking.paymentDate, booking.paymentDate)}</p>
					</div>

					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Updated Payment Status</h2>
						<p><strong>Total Amount:</strong> £${booking.totalAmount.toFixed(2)}</p>
						<p><strong>Total Paid:</strong> £${(booking.paidAmount || 0).toFixed(2)}</p>
						${balanceDue > 0 ? `<p><strong>Balance Due:</strong> £${balanceDue.toFixed(2)}</p>` : ''}
						<p><strong>Status:</strong> ${paymentStatusBadge}</p>
					</div>

					<div style="text-align: center; margin: 30px 0;">
						<a href="${siteUrl}/admin/conferences/bookings?booking=${booking.id}" style="background-color: #0693ad; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Booking Details</a>
					</div>

					<p style="color: #666; font-size: 14px; margin-top: 20px;">This is an automated notification from the MLG Conference Booking System.</p>
				</div>
			</body>
			</html>
		`;

		// Send to all admin emails
		const results = [];
		for (const adminEmail of adminEmails) {
			try {
				const result = await resend.emails.send({
					from: fromEmail,
					to: adminEmail,
					subject: `Payment Received: ${booking.bookingReference} - £${paymentAmount.toFixed(2)}`,
					html: emailHtml
				});
				results.push(result);
			} catch (error) {
				console.error(`Failed to send admin payment notification to ${adminEmail}:`, error);
			}
		}

		console.log('Admin payment notification sent:', results);
		return results;
	} catch (error) {
		console.error('Failed to send admin payment notification:', error);
		// Don't throw - admin notifications shouldn't fail the payment
	}
}

/**
 * Send payment confirmation email to user when payment is received
 */
export async function sendPaymentConfirmationEmail({ booking, conference, paymentAmount }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;

		const balanceDue = (booking.totalAmount || 0) - (booking.paidAmount || 0);
		const isFullyPaid = booking.paymentStatus === 'paid';

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
					<h1 style="color: white; margin: 0;">Payment Received</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>Dear ${booking.groupLeaderName},</p>
					${isFullyPaid ? `
						<p>Thank you! We have received your full payment for <strong>${conference.title}</strong>.</p>
						<div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
							<p style="margin: 0; color: #065f46;"><strong>✓ Your booking is now fully confirmed!</strong></p>
						</div>
					` : `
						<p>Thank you! We have received a payment of <strong>£${paymentAmount.toFixed(2)}</strong> for your booking.</p>
					`}
					
					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Payment Summary</h2>
						<p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
						<p><strong>Conference:</strong> ${conference.title}</p>
						<p><strong>Date:</strong> ${formatDateRange(conference.startDate, conference.endDate)}</p>
						<p><strong>Amount Received:</strong> £${paymentAmount.toFixed(2)}</p>
						<p><strong>Total Amount:</strong> £${booking.totalAmount.toFixed(2)}</p>
						<p><strong>Total Paid:</strong> £${(booking.paidAmount || 0).toFixed(2)}</p>
						${balanceDue > 0 ? `<p><strong>Balance Due:</strong> <span style="color: #ef4444; font-weight: bold;">£${balanceDue.toFixed(2)}</span></p>` : ''}
						<p><strong>Payment Status:</strong> ${isFullyPaid ? '<span style="color: #10b981; font-weight: bold;">Fully Paid</span>' : '<span style="color: #f59e0b; font-weight: bold;">Partial Payment</span>'}</p>
					</div>

					${balanceDue > 0 ? `
						<div style="text-align: center; margin: 30px 0;">
							<a href="${siteUrl}/my-account" style="background-color: #0693ad; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Pay Remaining Balance</a>
						</div>
					` : ''}

					<p>You can view your booking details and manage payments at any time by logging into your account.</p>
					<p>If you have any questions, please don't hesitate to contact us.</p>
					<p>Best regards,<br>Mission Life Grace Team</p>
				</div>
			</body>
			</html>
		`;

		const result = await resend.emails.send({
			from: fromEmail,
			to: booking.groupLeaderEmail,
			subject: `Payment Confirmation: ${booking.bookingReference} - ${conference.title}`,
			html: emailHtml
		});

		console.log('Payment confirmation email sent:', result);
		return result;
	} catch (error) {
		console.error('Failed to send payment confirmation email:', error);
		throw error;
	}
}

/**
 * Send payment reminder email to user for unpaid/partial bookings
 */
export async function sendPaymentReminderEmail({ booking, conference, daysUntilDeadline = null }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;

		const balanceDue = (booking.totalAmount || 0) - (booking.paidAmount || 0);
		const urgencyMessage = daysUntilDeadline !== null && daysUntilDeadline <= 7
			? `<div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
				<p style="margin: 0; color: #991b1b;"><strong>Urgent:</strong> Payment is due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}. Please complete your payment to secure your booking.</p>
			</div>`
			: '';

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
					<h1 style="color: white; margin: 0;">Payment Reminder</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>Dear ${booking.groupLeaderName},</p>
					<p>This is a reminder that your booking for <strong>${conference.title}</strong> has an outstanding balance.</p>
					
					${urgencyMessage}

					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Payment Summary</h2>
						<p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
						<p><strong>Conference:</strong> ${conference.title}</p>
						<p><strong>Date:</strong> ${formatDateRange(conference.startDate, conference.endDate)}</p>
						<p><strong>Total Amount:</strong> £${booking.totalAmount.toFixed(2)}</p>
						${booking.paidAmount > 0 ? `<p><strong>Amount Paid:</strong> £${booking.paidAmount.toFixed(2)}</p>` : ''}
						<p><strong>Balance Due:</strong> <span style="font-size: 18px; font-weight: bold; color: #ef4444;">£${balanceDue.toFixed(2)}</span></p>
					</div>

					<div style="text-align: center; margin: 30px 0;">
						<a href="${siteUrl}/my-account" style="background-color: #0693ad; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Pay Now</a>
					</div>

					<p>You can log in to your account at any time to view your booking details and make payments.</p>
					<p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
					<p>Best regards,<br>Mission Life Grace Team</p>
				</div>
			</body>
			</html>
		`;

		const result = await resend.emails.send({
			from: fromEmail,
			to: booking.groupLeaderEmail,
			subject: `Payment Reminder: ${booking.bookingReference} - ${conference.title}`,
			html: emailHtml
		});

		console.log('Payment reminder email sent:', result);
		return result;
	} catch (error) {
		console.error('Failed to send payment reminder email:', error);
		throw error;
	}
}

/**
 * Send event booking confirmation email
 */
export async function sendEventBookingConfirmationEmail({ booking, event, attendees }) {
	try {
		const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const siteUrl = env.PUBLIC_SITE_URL || 'https://www.missionlifegrace.org.uk';
		const logoUrl = `${siteUrl}/images/mlg-logo.png`;

		// Generate ticket list HTML
		const ticketList = attendees.map(attendee => {
			const ticketType = attendee.ticketType || { name: 'N/A' };
			return `
				<tr>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${attendee.fullName}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${ticketType.name || 'N/A'}</td>
				</tr>
			`;
		}).join('');

		// Format event date
		const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-GB', { 
			weekday: 'long',
			day: 'numeric', 
			month: 'long', 
			year: 'numeric' 
		}) : 'TBA';
		
		const eventTime = event.time ? (() => {
			const [hours, minutes] = event.time.split(':');
			const hour = parseInt(hours);
			const ampm = hour >= 12 ? 'PM' : 'AM';
			const hour12 = hour % 12 || 12;
			return `${hour12}:${minutes || '00'} ${ampm}`;
		})() : 'TBA';

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
					<h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
					<p>Dear ${booking.customerName},</p>
					<p>Thank you for booking tickets for <strong>${event.title}</strong>!</p>
					
					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Booking Details</h2>
						<p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
						<p><strong>Event:</strong> ${event.title}</p>
						<p><strong>Date:</strong> ${eventDate}</p>
						<p><strong>Time:</strong> ${eventTime}</p>
						${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
						<p><strong>Total Amount:</strong> £${booking.totalAmount.toFixed(2)}</p>
						<p><strong>Payment Status:</strong> ${booking.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}</p>
					</div>

					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<h2 style="margin-top: 0; color: #0693ad;">Attendees</h2>
						<table style="width: 100%; border-collapse: collapse;">
							<thead>
								<tr style="background: #f0f0f0;">
									<th style="padding: 8px; text-align: left; border-bottom: 2px solid #0693ad;">Name</th>
									<th style="padding: 8px; text-align: left; border-bottom: 2px solid #0693ad;">Ticket Type</th>
								</tr>
							</thead>
							<tbody>
								${ticketList}
							</tbody>
						</table>
					</div>

					${booking.paymentStatus === 'unpaid' ? `
						<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
							<p style="margin: 0;"><strong>Payment Required:</strong> Please complete your payment to secure your booking.</p>
						</div>
					` : ''}

					${event.date ? `
						<div style="text-align: center; margin: 30px 0;">
							<a href="${generateEventCalendarLink(event)}" style="background-color: #0693ad; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Add to Calendar</a>
						</div>
					` : ''}

					<p>If you have any questions, please don't hesitate to contact us.</p>
					<p>We look forward to seeing you at the event!</p>
					<p>Best regards,<br>Mission Life Grace Team</p>
				</div>
			</body>
			</html>
		`;

		const result = await resend.emails.send({
			from: fromEmail,
			to: booking.customerEmail,
			subject: `Booking Confirmation: ${event.title}`,
			html: emailHtml
		});

		console.log('Event booking confirmation email sent:', result);
		return result;
	} catch (error) {
		console.error('Failed to send event booking confirmation email:', error);
		throw error;
	}
}

/**
 * Generate Google Calendar link for event
 */
function generateEventCalendarLink(event) {
	if (!event.date) return '';
	
	const eventDate = new Date(event.date);
	
	// Add time if specified
	if (event.time) {
		const [hours, minutes] = event.time.split(':');
		eventDate.setHours(parseInt(hours), parseInt(minutes || 0), 0);
	} else {
		eventDate.setHours(18, 0, 0); // Default to 6 PM
	}
	
	// End time is 2 hours after start (or use endTime if provided)
	const endDate = new Date(eventDate);
	if (event.endTime) {
		const [hours, minutes] = event.endTime.split(':');
		endDate.setHours(parseInt(hours), parseInt(minutes || 0), 0);
	} else {
		endDate.setHours(eventDate.getHours() + 2);
	}

	// Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
	const formatDate = (date) => {
		return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
	};

	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: event.title,
		dates: `${formatDate(eventDate)}/${formatDate(endDate)}`,
		details: event.description ? event.description.replace(/<[^>]*>/g, '').substring(0, 500) : '',
		location: event.location || ''
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
