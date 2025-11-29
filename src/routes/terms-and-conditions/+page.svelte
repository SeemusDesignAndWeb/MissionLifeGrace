<script lang="js">
	import Footer from '$lib/components/Footer.svelte';
	
	export let data;
</script>

<svelte:head>
	<title>Terms and Conditions - Mission Life Grace</title>
	<meta name="description" content="Terms and Conditions for Mission Life Grace website" />
</svelte:head>

<div class="container mx-auto px-4 py-12 max-w-4xl">
	<h1 class="text-4xl font-bold mb-8">{data.policy?.title || 'Terms and Conditions'}</h1>
	
	{#if data.policy?.content}
		<div class="prose max-w-none">
			{@html data.policy.content}
		</div>
	{:else}
		<p class="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

		<div class="prose prose-lg max-w-none">
		<section class="mb-8">
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
				<p class="mb-2">{data.contactInfo?.address || '542 Westhorne Avenue, Eltham, London, SE9 6RR'}</p>
				<p class="mb-2">
					<strong>Email:</strong> <a href="mailto:{data.contactInfo?.email || 'enquiries@missionlifegrace.net'}" class="text-primary hover:underline">{data.contactInfo?.email || 'enquiries@missionlifegrace.net'}</a>
				</p>
		</div>
	</section>
	</div>
	{/if}
</div>

<Footer contactInfo={data.contactInfo} />

