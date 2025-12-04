<script lang="js">
	import ConferenceBookingForm from '$lib/components/ConferenceBookingForm.svelte';
	import Footer from '$lib/components/Footer.svelte';

	export let data;
	
	let showBookingForm = false;
	let conference = data.conference;
	let pageContent = data.pageContent;
	let pageTitle = data.pageTitle;
	let supportingPages = data.supportingPages || [];
	let ticketTypes = data.ticketTypes || [];
	let isAuthenticated = data.isAuthenticated || false;
	
	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	}

	function formatTime(timeString) {
		if (!timeString) return '';
		return timeString;
	}

	function isEarlyBirdActive() {
		if (!conference) return false;
		const now = new Date();
		const startDate = conference.earlyBirdStartDate ? new Date(conference.earlyBirdStartDate) : null;
		const endDate = conference.earlyBirdEndDate ? new Date(conference.earlyBirdEndDate) : null;
		const discountAmount = conference.earlyBirdDiscountAmount || 0;

		if (!startDate || !endDate || discountAmount <= 0) return false;

		// Set time to start of day for comparison
		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
		const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
		end.setHours(23, 59, 59, 999); // End of day

		return nowDate >= start && nowDate <= end;
	}

	function isEarlyBirdEndingSoon() {
		if (!isEarlyBirdActive()) return false;
		const now = new Date();
		const endDate = conference.earlyBirdEndDate ? new Date(conference.earlyBirdEndDate) : null;
		if (!endDate) return false;

		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
		const daysUntilEnd = Math.ceil((end - nowDate) / (1000 * 60 * 60 * 24));

		// Show "ending soon" if 7 days or less remaining
		return daysUntilEnd <= 7 && daysUntilEnd > 0;
	}

	function getCurrentPrice(ticketType) {
		// Check conference-level early bird pricing first
		if (isEarlyBirdActive() && conference.earlyBirdDiscountAmount > 0) {
			const discount = conference.earlyBirdDiscountAmount || 0;
			return Math.max(0, ticketType.price - discount);
		}

		// Fall back to ticket-level early bird pricing (for backward compatibility)
		const now = new Date();
		if (ticketType.earlyBirdEndDate && new Date(ticketType.earlyBirdEndDate) > now && ticketType.earlyBirdPrice > 0) {
			return ticketType.earlyBirdPrice;
		}

		return ticketType.price;
	}
</script>

<svelte:head>
	<title>{pageTitle} - {conference.title}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section -->
	{#if conference.images && conference.images.length > 0}
		<div class="relative min-h-[500px] bg-cover bg-center" style="background-image: url('{conference.images[0]}');">
			<div class="absolute inset-0 bg-black bg-opacity-20"></div>
		<div class="relative container mx-auto px-4 py-8 min-h-[500px] flex flex-col justify-center">
			<div class="grid md:grid-cols-2 gap-8 items-center">
				<!-- Left Column: Title and Info -->
				<div class="text-white drop-shadow-lg">
					<h1 class="text-5xl font-bold mb-4 text-white">{conference.title}</h1>
					{#if conference.startDate}
						<div class="mb-3">
							<p class="text-xl text-white">
								{#if conference.endDate && conference.endDate !== conference.startDate}
									{formatDate(conference.startDate)} - {formatDate(conference.endDate)}
								{:else}
									{formatDate(conference.startDate)}
								{/if}
							</p>
						</div>
					{/if}
					{#if conference.venue && conference.venue.name}
						<div class="flex flex-col gap-1">
							<p class="text-lg text-white font-semibold">{conference.venue.name}</p>
							{#if conference.venue.address}
								<p class="text-base text-white/90">{conference.venue.address}</p>
							{/if}
							{#if conference.venue.city}
								<p class="text-base text-white/90">
									{conference.venue.city}{conference.venue.postcode ? `, ${conference.venue.postcode}` : ''}{conference.venue.country ? `, ${conference.venue.country}` : ''}
								</p>
							{/if}
						</div>
					{/if}
					{#if conference.registrationOpen}
						<div class="mt-6 flex gap-3">
							<button
								on:click={() => showBookingForm = true}
								class="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
								</svg>
								Book Now
							</button>
							{#if isAuthenticated}
								<a
									href="/my-account"
									class="inline-flex items-center gap-2 px-6 py-4 bg-white/20 hover:bg-white/30 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border border-white/30"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
									</svg>
									Sign In
								</a>
							{:else}
								<a
									href="/my-account/login"
									class="inline-flex items-center gap-2 px-6 py-4 bg-white/20 hover:bg-white/30 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border border-white/30"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
									</svg>
									Sign In
								</a>
							{/if}
						</div>
					{/if}
				</div>
				<!-- Right Column: Supporting Pages Navigation -->
				{#if supportingPages && supportingPages.length > 0}
					<div class="grid grid-cols-2 gap-3">
						{#each supportingPages as page}
							<a
								href="/conference/{conference.slug}/{page.id}"
								class="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all transform hover:scale-105 border border-white/20 group cursor-pointer"
							>
								<svg class="w-8 h-8 text-white mb-2 group-hover:text-brand-blue transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path stroke-linecap="round" stroke-linejoin="round" d={page.icon} />
								</svg>
								<span class="text-white text-xs text-center font-medium group-hover:text-brand-blue transition-colors leading-tight">{page.label}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		</div>
	{:else}
		<div class="bg-primary text-white py-16 min-h-[500px] flex items-center">
			<div class="container mx-auto px-4 w-full">
				<div class="grid md:grid-cols-2 gap-8 items-center">
					<!-- Left Column: Title and Info -->
					<div>
						<h1 class="text-5xl font-bold mb-4 text-white">{conference.title}</h1>
						{#if conference.startDate}
							<div class="mb-3">
								<p class="text-xl text-white">
									{#if conference.endDate && conference.endDate !== conference.startDate}
										{formatDate(conference.startDate)} - {formatDate(conference.endDate)}
									{:else}
										{formatDate(conference.startDate)}
									{/if}
								</p>
							</div>
						{/if}
						{#if conference.venue && conference.venue.name}
							<div class="flex flex-col gap-1">
								<p class="text-lg text-white font-semibold">{conference.venue.name}</p>
								{#if conference.venue.address}
									<p class="text-base text-white/90">{conference.venue.address}</p>
								{/if}
								{#if conference.venue.city}
									<p class="text-base text-white/90">
										{conference.venue.city}{conference.venue.postcode ? `, ${conference.venue.postcode}` : ''}{conference.venue.country ? `, ${conference.venue.country}` : ''}
									</p>
								{/if}
							</div>
						{/if}
						{#if conference.registrationOpen}
							<div class="mt-6 flex gap-3">
								<button
									on:click={() => showBookingForm = true}
									class="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-primary text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
									</svg>
									Book Now
								</button>
								{#if isAuthenticated}
									<a
										href="/my-account"
										class="inline-flex items-center gap-2 px-6 py-4 bg-white/20 hover:bg-white/30 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border border-white/30"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
										</svg>
										Sign In
									</a>
								{:else}
									<a
										href="/my-account/login"
										class="inline-flex items-center gap-2 px-6 py-4 bg-white/20 hover:bg-white/30 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border border-white/30"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
										</svg>
										Sign In
									</a>
								{/if}
							</div>
						{/if}
					</div>
					<!-- Right Column: Supporting Pages Navigation -->
					{#if supportingPages && supportingPages.length > 0}
						<div class="grid grid-cols-2 gap-3">
							{#each supportingPages as page}
								<a
									href="/conference/{conference.slug}/{page.id}"
									class="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all transform hover:scale-105 border border-white/20 group cursor-pointer"
								>
									<svg class="w-8 h-8 text-white mb-2 group-hover:text-brand-blue transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path stroke-linecap="round" stroke-linejoin="round" d={page.icon} />
									</svg>
									<span class="text-white text-xs text-center font-medium group-hover:text-brand-blue transition-colors leading-tight">{page.label}</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Content -->
	<div class="container mx-auto px-4 py-12">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Content Column -->
			<div class="lg:col-span-2">
				<div class="bg-white p-8 rounded-lg shadow">
					<a
						href="/conference/{conference.slug}"
						class="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-6 transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
						<span class="font-semibold">Back to Conference</span>
					</a>
					<h2 class="text-3xl font-bold mb-6">{pageTitle}</h2>
					<div class="prose max-w-none text-gray-700">{@html pageContent}</div>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="lg:col-span-1">
				<!-- Registration Card -->
				<div class="bg-white p-6 rounded-lg shadow sticky top-4">
					<h2 class="text-2xl font-bold mb-4">Book Now</h2>
					{#if !conference.registrationOpen}
						<p class="text-gray-600 mb-4">Registration is currently closed.</p>
					{:else}
						<div class="space-y-4">
							{#if conference.startDate}
								<div>
									<p class="text-sm text-gray-600">Date</p>
									<p class="font-semibold">{formatDate(conference.startDate)}</p>
									{#if conference.endDate && conference.endDate !== conference.startDate}
										<p class="font-semibold">to {formatDate(conference.endDate)}</p>
									{/if}
								</div>
							{/if}
							{#if conference.startTime}
								<div>
									<p class="text-sm text-gray-600">Time</p>
									<p class="font-semibold">{formatTime(conference.startTime)}</p>
									{#if conference.endTime}
										<p class="font-semibold">to {formatTime(conference.endTime)}</p>
									{/if}
								</div>
							{/if}
							<div class="grid grid-cols-2 gap-3">
								<button
									on:click={() => showBookingForm = true}
									class="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold inline-flex items-center justify-center gap-2"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
									</svg>
									<span class="hidden sm:inline">Book Now</span>
									<span class="sm:hidden">Book</span>
								</button>
								{#if isAuthenticated}
									<a
										href="/my-account"
										class="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-center inline-flex items-center justify-center gap-2"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
										</svg>
										<span class="hidden sm:inline">Sign In</span>
										<span class="sm:hidden">Sign In</span>
									</a>
								{:else}
									<a
										href="/my-account/login"
										class="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-center inline-flex items-center justify-center gap-2"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
										</svg>
										<span class="hidden sm:inline">Sign In</span>
										<span class="sm:hidden">Sign In</span>
									</a>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Ticket Types -->
				{#if ticketTypes && ticketTypes.length > 0}
					<div class="bg-white p-6 rounded-lg shadow mt-6">
						<h3 class="text-xl font-bold mb-4">Ticket Types</h3>
						<div class="space-y-3">
							{#each ticketTypes.filter(t => t.enabled) as ticketType}
								<div class="border rounded p-3">
									<div class="flex justify-between items-start">
										<div>
											<p class="font-semibold">{ticketType.name}</p>
											<p class="text-sm text-gray-600 capitalize">{ticketType.type}</p>
											{#if ticketType.camping}
												<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Camping</span>
											{/if}
										</div>
										<div class="text-right">
											<div class="flex items-center gap-2 justify-end mb-1">
												{#if isEarlyBirdActive()}
													{#if isEarlyBirdEndingSoon()}
														<span class="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded">Early Bird Ending Soon</span>
													{:else}
														<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">Early Bird</span>
													{/if}
												{/if}
											</div>
											<div class="flex items-baseline gap-2 justify-end">
												{#if isEarlyBirdActive() && getCurrentPrice(ticketType) < ticketType.price}
													<p class="text-sm text-gray-400 line-through">£{ticketType.price.toFixed(2)}</p>
												{/if}
												<p class="font-bold">£{getCurrentPrice(ticketType).toFixed(2)}</p>
											</div>
											{#if ticketType.capacity}
												<p class="text-xs text-gray-500">{ticketType.capacity - (ticketType.sold || 0)} remaining</p>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Booking Form Modal -->
	{#if showBookingForm}
		<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showBookingForm = false} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showBookingForm = false)}>
			<div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" on:click|stopPropagation role="dialog">
				<div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
					<h2 class="text-2xl font-bold">Register for {conference.title}</h2>
					<button on:click={() => showBookingForm = false} class="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
				</div>
				<div class="p-6">
					<ConferenceBookingForm {conference} {ticketTypes} on:close={() => showBookingForm = false} />
				</div>
			</div>
		</div>
	{/if}

	<Footer contactInfo={data.contactInfo} />
</div>
