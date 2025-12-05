<script lang="js">
	export let contactInfo = {
		address: '542 Westhorne Avenue, Eltham, London, SE9 6RR',
		email: 'enquiries@missionlifegrace.net'
	};
</script>

<footer class="bg-gray-900 text-white py-12">
	<div class="container mx-auto px-4">
		<div class="grid md:grid-cols-2 gap-12 mb-8">
			<!-- About & Contact -->
			<div>
				<a href="/" class="flex items-center gap-3 mb-6">
					<img
						src="/images/mlg-logo.svg"
						alt="Mission Life Grace"
						class="h-10 w-auto brightness-0 invert"
					/>
					<span class="text-xl font-light text-white">
						Mission Life Grace
					</span>
				</a>
				<p class="text-gray-400 text-sm mb-6 max-w-md">
					A network of churches on mission together to see the Kingdom of God come, where broken lives are restored, the lost are found and communities transformed.
				</p>
				<div>
					<h3 class="text-white font-semibold mb-4">Contact</h3>
					<div class="space-y-2 text-sm">
						{#if contactInfo.address}
							<p class="text-gray-400">{contactInfo.address}</p>
						{/if}
						{#if contactInfo.email}
							<p>
								<a href="mailto:{contactInfo.email}" class="text-gray-400 hover:text-white transition-colors">
									{contactInfo.email}
								</a>
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Quick Links -->
			<div>
				<h3 class="text-white font-semibold mb-4">Quick Links</h3>
				<div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
					<a href="/churches" class="text-gray-400 hover:text-white transition-colors">Churches</a>
					<a href="/values" class="text-gray-400 hover:text-white transition-colors">Values</a>
					<a href="/team" class="text-gray-400 hover:text-white transition-colors">Team</a>
					<a href="/events" class="text-gray-400 hover:text-white transition-colors">Events</a>
					<a href="/conferences" class="text-gray-400 hover:text-white transition-colors">Conferences</a>
					<a href="/contact" class="text-gray-400 hover:text-white transition-colors">Contact</a>
				</div>
			</div>
		</div>

		<!-- Copyright and Legal Links -->
		<div class="border-t border-gray-800 pt-8">
			<div class="flex flex-col md:flex-row justify-between items-center gap-4">
				<p class="text-sm text-gray-400">
					&copy; {new Date().getFullYear()} Mission Life Grace. All rights reserved.
				</p>
				<div class="flex flex-wrap gap-4 text-sm">
					<a href="/privacy-policy" class="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
					<a href="/terms-and-conditions" class="text-gray-400 hover:text-white transition-colors">Terms & Conditions</a>
					<a href="/cookie-policy" class="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
				</div>
			</div>
		</div>
	</div>
</footer>
