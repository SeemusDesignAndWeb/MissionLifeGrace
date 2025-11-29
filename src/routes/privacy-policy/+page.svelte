<script lang="js">
	import Footer from '$lib/components/Footer.svelte';
	
	export let data;
</script>

<svelte:head>
	<title>Privacy Policy - Mission Life Grace</title>
	<meta name="description" content="Privacy Policy for Mission Life Grace website" />
</svelte:head>

<div class="container mx-auto px-4 py-12 max-w-4xl">
	<h1 class="text-4xl font-bold mb-8">{data.policy?.title || 'Privacy Policy'}</h1>
	
	{#if data.policy?.content}
		<div class="prose max-w-none">
			{@html data.policy.content}
		</div>
	{:else}
		<p class="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

		<div class="prose prose-lg max-w-none">
				<section class="mb-8">
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
				<li><strong>Contact Information:</strong> Name, email address, phone number, postal address</li>
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

