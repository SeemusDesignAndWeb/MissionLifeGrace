<script lang="js">
	import Footer from '$lib/components/Footer.svelte';
	
	export let data;
</script>

<svelte:head>
	<title>Cookie Policy - Mission Life Grace</title>
	<meta name="description" content="Cookie Policy for Mission Life Grace website" />
</svelte:head>

<div class="container mx-auto px-4 py-12 max-w-4xl">
	<h1 class="text-4xl font-bold mb-8">{data.policy?.title || 'Cookie Policy'}</h1>
	
	{#if data.policy?.content}
		<div class="prose max-w-none">
			{@html data.policy.content}
		</div>
	{:else}
		<p class="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

		<div class="prose prose-lg max-w-none">
				<section class="mb-8">
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

