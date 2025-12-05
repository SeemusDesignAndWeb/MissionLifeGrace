import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { getMlgLogoBase64, getMlgLogoMimeType } from '$lib/server/logo';

const resend = new Resend(env.RESEND_API_KEY || 're_C88Tpi9d_5uF8M4U2R8r4NbyTwjHBVZ6A');
const MLG_LOGO_BASE64 = getMlgLogoBase64();
const MLG_LOGO_MIME = getMlgLogoMimeType();

export const POST = async ({ request }) => {
	try {
		const { name, email, subject, message, page, settings } = await request.json();
		
		// Validation
		if (!name || !email || !message) {
			return json({ error: 'Name, email, and message are required' }, { status: 400 });
		}
		
		// Basic spam check
		if (message.length > 5000) {
			return json({ error: 'Message is too long' }, { status: 400 });
		}
		
		// Get recipient email from environment
		const recipientEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		const senderEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		
		// Create email subject
		const emailSubject = subject 
			? `Support Request: ${subject}` 
			: `Support Request from ${name}`;
		
		// Send support email
		const result = await resend.emails.send({
			from: senderEmail,
			to: [recipientEmail],
			replyTo: email,
			subject: emailSubject,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Support Request</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #2d7a32 0%, #1e5a22 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						${MLG_LOGO_BASE64 ? `<img src="data:${MLG_LOGO_MIME};base64,${MLG_LOGO_BASE64}" alt="MLG Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />` : '<div style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 20px;">Mission Life Grace</div>'}
						<h1 style="color: white; margin: 0; font-size: 24px;">Support Request</h1>
					</div>
					
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
						<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
							<h2 style="color: #2d7a32; margin-top: 0; font-size: 18px; border-bottom: 2px solid #2d7a32; padding-bottom: 10px;">Contact Information</h2>
							<table style="width: 100%; border-collapse: collapse;">
								<tr>
									<td style="padding: 8px 0; font-weight: 600; color: #666; width: 120px;">Name:</td>
									<td style="padding: 8px 0; color: #333;">${name}</td>
								</tr>
								<tr>
									<td style="padding: 8px 0; font-weight: 600; color: #666;">Email:</td>
									<td style="padding: 8px 0; color: #333;">
										<a href="mailto:${email}" style="color: #2d7a32; text-decoration: none;">${email}</a>
									</td>
								</tr>
								${page ? `
								<tr>
									<td style="padding: 8px 0; font-weight: 600; color: #666;">Page:</td>
									<td style="padding: 8px 0; color: #333;">${page}</td>
								</tr>
								` : ''}
								${settings ? `
								<tr>
									<td style="padding: 8px 0; font-weight: 600; color: #666;">Context:</td>
									<td style="padding: 8px 0; color: #333;">${settings}</td>
								</tr>
								` : ''}
							</table>
						</div>
						
						${subject ? `
						<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
							<h2 style="color: #2d7a32; margin-top: 0; font-size: 18px; border-bottom: 2px solid #2d7a32; padding-bottom: 10px;">Subject</h2>
							<p style="color: #333; margin: 0;">${subject}</p>
						</div>
						` : ''}
						
						<div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
							<h2 style="color: #2d7a32; margin-top: 0; font-size: 18px; border-bottom: 2px solid #2d7a32; padding-bottom: 10px;">Message</h2>
							<div style="color: #333; white-space: pre-wrap; line-height: 1.8;">${message.replace(/\n/g, '<br>')}</div>
						</div>
						
						<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
							<p style="margin: 0;">This support request was sent from the help system on Eltham Green Community Church website.</p>
							<p style="margin: 5px 0 0 0;">
								<a href="mailto:${email}" style="color: #2d7a32; text-decoration: none;">Reply to ${name}</a>
							</p>
						</div>
					</div>
				</body>
				</html>
			`,
			text: `
Support Request

Contact Information:
Name: ${name}
Email: ${email}
${page ? `Page: ${page}` : ''}
${settings ? `Context: ${settings}` : ''}

${subject ? `Subject: ${subject}\n` : ''}
Message:
${message}

---
This support request was sent from the help system on Eltham Green Community Church website.
Reply to: ${email}
			`.trim()
		});
		
		console.log('Support email sent successfully:', result);
		return json({ success: true, message: 'Support request sent successfully' });
	} catch (error) {
		console.error('Support email error:', error);
		return json({ error: 'Failed to send support request. Please try again.' }, { status: 500 });
	}
};

