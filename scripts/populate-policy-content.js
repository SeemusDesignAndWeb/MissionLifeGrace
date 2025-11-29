#!/usr/bin/env node

/**
 * Script to populate the database with existing policy page content
 * Usage: node scripts/populate-policy-content.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data/database.json');

// Read existing database
let db;
try {
	const dbContent = readFileSync(DB_PATH, 'utf-8');
	db = JSON.parse(dbContent);
} catch (error) {
	console.error('Failed to read database:', error.message);
	process.exit(1);
}

// Initialize policies if they don't exist
if (!db.policies) {
	db.policies = {};
}

// Privacy Policy content
const privacyPolicyContent = `<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">1. Introduction</h2>
	<p class="mb-4">
		Mission Life Grace ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services, including conference bookings and event registrations.
	</p>
	<p class="mb-4">
		By using our website, you consent to the data practices described in this policy. If you do not agree with the practices described in this policy, please do not use our services.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">2. Information We Collect</h2>
	
	<h3 class="text-xl font-semibold mb-3 mt-4">2.1 Personal Information</h3>
	<p class="mb-4">We may collect the following types of personal information:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li><strong>Contact Information:</strong> Name, email address, postal address</li>
		<li><strong>Booking Information:</strong> Conference and event registration details, ticket selections, payment information</li>
		<li><strong>Demographic Information:</strong> Age, date of birth (for age-appropriate events), home church or group affiliation</li>
		<li><strong>Medical and Emergency Information:</strong> For child and teen registrations, we collect emergency contact details, medical history, allergies, dietary restrictions, and consent waivers</li>
		<li><strong>Communication Preferences:</strong> Your preferences for receiving communications from us</li>
	</ul>

	<h3 class="text-xl font-semibold mb-3 mt-4">2.2 Automatically Collected Information</h3>
	<p class="mb-4">When you visit our website, we may automatically collect certain information about your device and browsing behavior:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>IP address</li>
		<li>Browser type and version</li>
		<li>Operating system</li>
		<li>Pages visited and time spent on pages</li>
		<li>Referring website addresses</li>
	</ul>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
	<p class="mb-4">We use the information we collect for the following purposes:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>To process and manage conference and event bookings</li>
		<li>To communicate with you about your bookings, including confirmations, updates, and reminders</li>
		<li>To process payments and manage financial transactions</li>
		<li>To provide customer support and respond to your inquiries</li>
		<li>To send you information about upcoming events, conferences, and church activities (with your consent)</li>
		<li>To ensure the safety and well-being of attendees, particularly children and teens, by maintaining emergency contact and medical information</li>
		<li>To comply with legal obligations and protect our legal rights</li>
		<li>To improve our website and services</li>
	</ul>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
	<p class="mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
	
	<h3 class="text-xl font-semibold mb-3 mt-4">4.1 Service Providers</h3>
	<p class="mb-4">We may share information with third-party service providers who perform services on our behalf, including:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li><strong>Payment Processors:</strong> PayPal for processing payments (see PayPal's privacy policy for their data practices)</li>
		<li><strong>Email Services:</strong> Resend for sending transactional and marketing emails</li>
		<li><strong>Hosting Providers:</strong> For website hosting and data storage</li>
	</ul>

	<h3 class="text-xl font-semibold mb-3 mt-4">4.2 Legal Requirements</h3>
	<p class="mb-4">We may disclose your information if required by law or in response to valid legal requests, such as court orders or government regulations.</p>

	<h3 class="text-xl font-semibold mb-3 mt-4">4.3 Safety and Emergency Situations</h3>
	<p class="mb-4">In emergency situations involving the safety of attendees, particularly children and teens, we may share relevant medical and emergency contact information with appropriate personnel, medical professionals, or emergency services.</p>

	<h3 class="text-xl font-semibold mb-3 mt-4">4.4 Church Network</h3>
	<p class="mb-4">With your consent, we may share your information with other churches in the Mission Life Grace network for coordination of events and activities.</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">5. Data Storage and Security</h2>
	<p class="mb-4">
		We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
	</p>
	<p class="mb-4">
		Your data is stored on secure servers and is accessible only to authorized personnel who need access to perform their duties. We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">6. Your Rights</h2>
	<p class="mb-4">Under UK data protection laws, you have the following rights:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li><strong>Right to Access:</strong> You can request a copy of the personal information we hold about you</li>
		<li><strong>Right to Rectification:</strong> You can request correction of inaccurate or incomplete information</li>
		<li><strong>Right to Erasure:</strong> You can request deletion of your personal information in certain circumstances</li>
		<li><strong>Right to Restrict Processing:</strong> You can request that we limit how we use your information</li>
		<li><strong>Right to Data Portability:</strong> You can request a copy of your data in a structured, machine-readable format</li>
		<li><strong>Right to Object:</strong> You can object to certain types of processing of your information</li>
		<li><strong>Right to Withdraw Consent:</strong> Where we rely on your consent, you can withdraw it at any time</li>
	</ul>
	<p class="mb-4">
		To exercise any of these rights, please contact us using the contact information provided at the end of this policy.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
	<p class="mb-4">
		We take the privacy of children very seriously. For child and teen registrations, we collect additional information including emergency contacts, medical information, and consent waivers. This information is used solely for the safety and well-being of the child during events and is shared only with authorized personnel and emergency services when necessary.
	</p>
	<p class="mb-4">
		Parents or guardians have the right to access, correct, or delete their child's information at any time by contacting us.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">8. Third-Party Links</h2>
	<p class="mb-4">
		Our website may contain links to third-party websites, such as PayPal for payments. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
	<p class="mb-4">
		We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. You are advised to review this policy periodically for any changes.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">10. Contact Us</h2>
	<p class="mb-4">
		If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
	</p>
	<div class="bg-gray-50 p-6 rounded-lg">
		<p class="mb-2"><strong>Mission Life Grace</strong></p>
		<p class="mb-2">542 Westhorne Avenue, Eltham, London, SE9 6RR</p>
		<p class="mb-2">
			<strong>Email:</strong> <a href="mailto:enquiries@missionlifegrace.net" class="text-primary hover:underline">enquiries@missionlifegrace.net</a>
		</p>
	</div>
</section>`;

// Terms and Conditions content
const termsAndConditionsContent = `<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
	<p class="mb-4">
		By accessing and using the Mission Life Grace website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">2. Use of Website</h2>
	<p class="mb-4">You agree to use our website only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website.</p>
	<p class="mb-4">You must not:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>Use the website in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the website</li>
		<li>Use the website in any way that is unlawful, illegal, fraudulent, or harmful</li>
		<li>Attempt to gain unauthorized access to any part of the website, server, or database</li>
		<li>Transmit any malicious code, viruses, or harmful data</li>
		<li>Collect or harvest any information or data from our website without our express written permission</li>
	</ul>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">3. Conference and Event Bookings</h2>
	
	<h3 class="text-xl font-semibold mb-3 mt-4">3.1 Booking Process</h3>
	<p class="mb-4">
		When booking tickets for conferences or events, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your booking details and for all activities that occur under your booking.
	</p>

	<h3 class="text-xl font-semibold mb-3 mt-4">3.2 Payment Terms</h3>
	<p class="mb-4">
		Payment for bookings can be made through PayPal. By completing a booking, you agree to pay the full amount specified at the time of booking. All prices are in British Pounds (GBP) unless otherwise stated.
	</p>
	<p class="mb-4">
		We offer flexible payment options including full payment or installment plans (Pay in 3/4) where available. If you choose an installment plan, you agree to make all scheduled payments on time. Failure to complete payments may result in cancellation of your booking.
	</p>

	<h3 class="text-xl font-semibold mb-3 mt-4">3.3 Booking Confirmation</h3>
	<p class="mb-4">
		Your booking is confirmed once payment is received and processed. You will receive a confirmation email with your booking reference and ticket details. Please keep this confirmation for your records.
	</p>

	<h3 class="text-xl font-semibold mb-3 mt-4">3.4 Cancellations and Refunds</h3>
	<p class="mb-4">
		Cancellation and refund policies vary by event. Please refer to the specific event or conference details for cancellation terms. Generally:
	</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>Refund requests must be submitted in writing to our contact email</li>
		<li>Refunds, if approved, will be processed within 14 business days</li>
		<li>Administrative fees may apply to cancellations</li>
		<li>No refunds will be issued for no-shows or late cancellations unless otherwise specified</li>
	</ul>

	<h3 class="text-xl font-semibold mb-3 mt-4">3.5 Group Bookings</h3>
	<p class="mb-4">
		For group bookings, the person making the booking (the "Group Leader") is responsible for:
	</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>Providing accurate information for all attendees</li>
		<li>Ensuring all attendees meet age requirements for their ticket type</li>
		<li>Completing all required forms and consents for child and teen attendees</li>
		<li>Making all payments on behalf of the group</li>
		<li>Communicating event information to all group members</li>
	</ul>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">4. Child and Teen Registrations</h2>
	<p class="mb-4">
		For child and teen registrations, parents or guardians must:
	</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>Provide accurate emergency contact information</li>
		<li>Disclose any relevant medical conditions, allergies, or dietary restrictions</li>
		<li>Provide necessary consent waivers for medical treatment, photography/videography, and activities</li>
		<li>Ensure the child or teen is aware of and agrees to participate in the event</li>
	</ul>
	<p class="mb-4">
		We reserve the right to refuse registration or remove a child or teen from an event if we believe it is in the best interest of the child, other attendees, or the event.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">5. Discount Codes</h2>
	<p class="mb-4">
		Discount codes are subject to terms and conditions specified at the time of issue. We reserve the right to:
	</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>Limit the use of discount codes to specific ticket types or events</li>
		<li>Set expiration dates for discount codes</li>
		<li>Limit the number of times a discount code can be used</li>
		<li>Revoke or modify discount codes at any time</li>
	</ul>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
	<p class="mb-4">
		All content on this website, including text, graphics, logos, images, and software, is the property of Mission Life Grace or its content suppliers and is protected by UK and international copyright laws.
	</p>
	<p class="mb-4">
		You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise use any content from this website without our prior written permission.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
	<p class="mb-4">
		To the fullest extent permitted by law, Mission Life Grace shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
	</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>Your use or inability to use our website or services</li>
		<li>Any unauthorized access to or use of our servers or any personal information stored therein</li>
		<li>Any interruption or cessation of transmission to or from our website</li>
		<li>Any bugs, viruses, trojan horses, or the like that may be transmitted to or through our website</li>
		<li>Any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content</li>
	</ul>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">8. Indemnification</h2>
	<p class="mb-4">
		You agree to indemnify and hold harmless Mission Life Grace, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of our website or services, your violation of these Terms and Conditions, or your violation of any rights of another.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
	<p class="mb-4">
		Our website uses third-party services, including PayPal for payment processing. Your use of these services is subject to their respective terms and conditions and privacy policies. We are not responsible for the practices of third-party service providers.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
	<p class="mb-4">
		We reserve the right to modify these Terms and Conditions at any time. We will notify users of any material changes by posting the updated terms on this page and updating the "Last updated" date. Your continued use of our website after such changes constitutes your acceptance of the new terms.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">11. Governing Law</h2>
	<p class="mb-4">
		These Terms and Conditions are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these terms or your use of our website shall be subject to the exclusive jurisdiction of the courts of England and Wales.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">12. Contact Us</h2>
	<p class="mb-4">
		If you have any questions about these Terms and Conditions, please contact us:
	</p>
	<div class="bg-gray-50 p-6 rounded-lg">
		<p class="mb-2"><strong>Mission Life Grace</strong></p>
		<p class="mb-2">542 Westhorne Avenue, Eltham, London, SE9 6RR</p>
		<p class="mb-2">
			<strong>Email:</strong> <a href="mailto:enquiries@missionlifegrace.net" class="text-primary hover:underline">enquiries@missionlifegrace.net</a>
		</p>
	</div>
</section>`;

// Cookie Policy content
const cookiePolicyContent = `<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
	<p class="mb-4">
		Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
	</p>
	<p class="mb-4">
		This Cookie Policy explains how Mission Life Grace uses cookies and similar technologies on our website, and how you can control them.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
	<p class="mb-4">We use cookies for the following purposes:</p>
	
	<h3 class="text-xl font-semibold mb-3 mt-4">2.1 Essential Cookies</h3>
	<p class="mb-4">These cookies are necessary for the website to function properly. They enable core functionality such as:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li><strong>Admin Authentication:</strong> Session cookies that allow authorized administrators to access the admin area of the website</li>
		<li><strong>Security:</strong> Cookies that help protect against unauthorized access and maintain security</li>
	</ul>
	<p class="mb-4">
		<strong>Cookie Name:</strong> <code class="bg-gray-100 px-2 py-1 rounded">admin_session</code><br />
		<strong>Purpose:</strong> Maintains your login session when accessing the admin area<br />
		<strong>Duration:</strong> Session (deleted when you close your browser)<br />
		<strong>Type:</strong> First-party, HTTP-only cookie
	</p>

	<h3 class="text-xl font-semibold mb-3 mt-4">2.2 Functional Cookies</h3>
	<p class="mb-4">These cookies enhance the functionality of our website and improve your experience:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li><strong>Draft Booking Storage:</strong> We use browser localStorage (not traditional cookies) to save your conference booking progress so you can return to complete it later</li>
		<li><strong>Session Storage:</strong> We use browser sessionStorage to temporarily store booking information during the payment process</li>
	</ul>
	<p class="mb-4">
		<strong>Storage Type:</strong> Browser localStorage<br />
		<strong>Key:</strong> <code class="bg-gray-100 px-2 py-1 rounded">conference-booking-draft-[conference-id]</code><br />
		<strong>Purpose:</strong> Saves your booking form progress (selected tickets, attendee information) so you can return to complete your booking<br />
		<strong>Duration:</strong> Until you complete the booking or clear your browser data<br />
		<strong>Data Stored:</strong> Booking form state, selected tickets, attendee details (no payment information)
	</p>
	<p class="mb-4">
		<strong>Storage Type:</strong> Browser sessionStorage<br />
		<strong>Key:</strong> <code class="bg-gray-100 px-2 py-1 rounded">pendingBookingId</code><br />
		<strong>Purpose:</strong> Temporarily stores booking ID during PayPal payment redirect<br />
		<strong>Duration:</strong> Session (deleted when you close your browser tab)
	</p>

	<h3 class="text-xl font-semibold mb-3 mt-4">2.3 Third-Party Cookies</h3>
	<p class="mb-4">We use third-party services that may set their own cookies:</p>
	
	<div class="bg-gray-50 p-6 rounded-lg mb-4">
		<h4 class="font-semibold mb-2">PayPal</h4>
		<p class="mb-2">
			When you make a payment through PayPal, PayPal sets cookies on your device to process your payment securely. These cookies are controlled by PayPal and are subject to PayPal's own cookie policy.
		</p>
		<p class="mb-2">
			<strong>Purpose:</strong> Payment processing, fraud prevention, and security<br />
			<strong>Privacy Policy:</strong> <a href="https://www.paypal.com/uk/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">PayPal Privacy Policy</a>
		</p>
	</div>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
	
	<table class="min-w-full border-collapse border border-gray-300 mb-4">
		<thead class="bg-gray-100">
			<tr>
				<th class="border border-gray-300 px-4 py-2 text-left">Cookie Name</th>
				<th class="border border-gray-300 px-4 py-2 text-left">Purpose</th>
				<th class="border border-gray-300 px-4 py-2 text-left">Duration</th>
				<th class="border border-gray-300 px-4 py-2 text-left">Type</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">admin_session</code></td>
				<td class="border border-gray-300 px-4 py-2">Maintains admin login session</td>
				<td class="border border-gray-300 px-4 py-2">Session</td>
				<td class="border border-gray-300 px-4 py-2">Essential, First-party</td>
			</tr>
			<tr>
				<td class="border border-gray-300 px-4 py-2">localStorage: <code class="bg-gray-100 px-2 py-1 rounded">conference-booking-draft-*</code></td>
				<td class="border border-gray-300 px-4 py-2">Saves booking form progress</td>
				<td class="border border-gray-300 px-4 py-2">Until booking completed or cleared</td>
				<td class="border border-gray-300 px-4 py-2">Functional, First-party</td>
			</tr>
			<tr>
				<td class="border border-gray-300 px-4 py-2">sessionStorage: <code class="bg-gray-100 px-2 py-1 rounded">pendingBookingId</code></td>
				<td class="border border-gray-300 px-4 py-2">Temporarily stores booking ID during payment</td>
				<td class="border border-gray-300 px-4 py-2">Session</td>
				<td class="border border-gray-300 px-4 py-2">Functional, First-party</td>
			</tr>
			<tr>
				<td class="border border-gray-300 px-4 py-2">PayPal Cookies</td>
				<td class="border border-gray-300 px-4 py-2">Payment processing and security</td>
				<td class="border border-gray-300 px-4 py-2">Varies (see PayPal policy)</td>
				<td class="border border-gray-300 px-4 py-2">Third-party</td>
			</tr>
		</tbody>
	</table>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
	<p class="mb-4">You have the right to accept or reject cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer.</p>
	
	<h3 class="text-xl font-semibold mb-3 mt-4">4.1 Browser Settings</h3>
	<p class="mb-4">You can control cookies through your browser settings. Here are links to instructions for popular browsers:</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Google Chrome</a></li>
		<li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Mozilla Firefox</a></li>
		<li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Safari</a></li>
		<li><a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Microsoft Edge</a></li>
	</ul>

	<h3 class="text-xl font-semibold mb-3 mt-4">4.2 Clearing LocalStorage and SessionStorage</h3>
	<p class="mb-4">To clear browser storage (localStorage and sessionStorage):</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li><strong>Chrome/Edge:</strong> Open Developer Tools (F12) → Application tab → Storage → Clear site data</li>
		<li><strong>Firefox:</strong> Open Developer Tools (F12) → Storage tab → Right-click and select "Delete All"</li>
		<li><strong>Safari:</strong> Open Developer Tools (Cmd+Option+I) → Storage tab → Clear storage</li>
	</ul>
	<p class="mb-4">
		<strong>Note:</strong> Disabling cookies or clearing browser storage may affect the functionality of our website, particularly:
	</p>
	<ul class="list-disc pl-6 mb-4 space-y-2">
		<li>You may not be able to access the admin area</li>
		<li>Your booking form progress may not be saved</li>
		<li>You may need to re-enter information during the booking process</li>
	</ul>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">5. Do Not Track Signals</h2>
	<p class="mb-4">
		Some browsers include a "Do Not Track" (DNT) feature that signals to websites you visit that you do not want to have your online activity tracked. Currently, there is no standard for how DNT signals should be interpreted. Our website does not currently respond to DNT signals.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">6. Changes to This Cookie Policy</h2>
	<p class="mb-4">
		We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
	</p>
</section>

<section class="mb-8">
	<h2 class="text-2xl font-semibold mb-4">7. Contact Us</h2>
	<p class="mb-4">
		If you have any questions about our use of cookies or this Cookie Policy, please contact us:
	</p>
	<div class="bg-gray-50 p-6 rounded-lg">
		<p class="mb-2"><strong>Mission Life Grace</strong></p>
		<p class="mb-2">542 Westhorne Avenue, Eltham, London, SE9 6RR</p>
		<p class="mb-2">
			<strong>Email:</strong> <a href="mailto:enquiries@missionlifegrace.net" class="text-primary hover:underline">enquiries@missionlifegrace.net</a>
		</p>
	</div>
</section>`;

// Update policies in database
db.policies = {
	privacyPolicy: {
		title: 'Privacy Policy',
		content: privacyPolicyContent,
		lastUpdated: new Date().toISOString()
	},
	termsAndConditions: {
		title: 'Terms and Conditions',
		content: termsAndConditionsContent,
		lastUpdated: new Date().toISOString()
	},
	cookiePolicy: {
		title: 'Cookie Policy',
		content: cookiePolicyContent,
		lastUpdated: new Date().toISOString()
	}
};

// Write back to database
try {
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
	console.log('✓ Successfully populated policy content into database');
	console.log('  - Privacy Policy: Added');
	console.log('  - Terms and Conditions: Added');
	console.log('  - Cookie Policy: Added');
	console.log('\nYou can now edit these policies in Admin → Policies');
} catch (error) {
	console.error('Failed to write database:', error.message);
	process.exit(1);
}

