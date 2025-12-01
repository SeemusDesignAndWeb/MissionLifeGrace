<script lang="js">
	import { onMount } from 'svelte';
	import ConferenceBookingForm from '$lib/components/ConferenceBookingForm.svelte';
	import Footer from '$lib/components/Footer.svelte';

	export let data;

	let showBookingForm = false;
	let conference;
	let ticketTypes;
	let isAuthenticated;
	
	$: conference = data.conference;
	$: ticketTypes = data.ticketTypes;
	$: isAuthenticated = data.isAuthenticated;
	
	let formKey = 0; // Key to force component remount

	// Ensure modal is closed on mount (prevent state persistence issues)
	onMount(() => {
		showBookingForm = false;
		// Clear any invalid drafts that might have step 4/5 without orderSummary
		if (conference?.id) {
			try {
				const draftKey = `conference-booking-draft-${conference.id}`;
				const draftJson = localStorage.getItem(draftKey);
				if (draftJson) {
					const draft = JSON.parse(draftJson);
				if ((draft.currentStep === 4 || draft.currentStep === 5) && !draft.orderSummary) {
					localStorage.removeItem(draftKey);
				}
				}
			} catch (e) {
				console.error('Error checking draft:', e);
			}
		}
	});
	
	// Reset form when modal opens by remounting the component
	$: if (showBookingForm) {
		formKey += 1; // Force component remount
	}

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


	// Get available supporting pages with icons
	$: supportingPages = (() => {
		if (!conference || !conference.supportingPages) return [];
		
		const pages = [
			{ 
				id: 'worship-ministry', 
				label: 'Worship and Ministry', 
				content: conference.supportingPages.worshipAndMinistry || '',
				icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
			},
			{ 
				id: 'kids-activities', 
				label: 'Kids Activities', 
				content: conference.supportingPages.kidsActivities || '',
				icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
			},
			{ 
				id: 'youth-activities', 
				label: 'Youth Activities', 
				content: conference.supportingPages.youthActivities || '',
				icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
			},
			{ 
				id: 'social-activities', 
				label: 'Social Activities', 
				content: conference.supportingPages.socialActivities || '',
				icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
			},
			{ 
				id: 'accommodation', 
				label: 'Accommodation', 
				content: conference.supportingPages.accommodation || '',
				icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
			},
			{ 
				id: 'what-you-need', 
				label: 'What You Need', 
				content: conference.supportingPages.whatYouNeed || '',
				icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
			}
		];
		
		return pages.filter(page => page.content && page.content.trim() && page.content.trim().length > 0);
	})();
</script>

<svelte:head>
	<title>{conference.title} - Conference</title>
	<meta name="description" content={conference.description?.replace(/<[^>]*>/g, '').substring(0, 160)} />
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
									Login
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
										Login
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

	<!-- Main Content -->
	<div class="container mx-auto px-4 py-12">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Content Column -->
			<div class="lg:col-span-2">
				<!-- Description -->
				{#if conference.description}
					<div class="bg-white p-6 rounded-lg shadow mb-6">
						<div class="prose max-w-none">{@html conference.description}</div>
					</div>
				{/if}

				<!-- Schedule -->
				{#if conference.schedule}
					<div class="bg-white p-6 rounded-lg shadow mb-6">
						<h2 class="text-2xl font-bold mb-4">Schedule</h2>
						<div class="prose max-w-none">{@html conference.schedule}</div>
					</div>
				{/if}

				<!-- Venue -->
				{#if conference.venue && conference.venue.name}
					<div class="bg-white p-6 rounded-lg shadow mb-6">
						<h2 class="text-2xl font-bold mb-4">Venue</h2>
						<div>
							<p class="font-semibold text-lg">{conference.venue.name}</p>
							{#if conference.venue.address}
								<p>{conference.venue.address}</p>
							{/if}
							{#if conference.venue.city}
								<p>{conference.venue.city}{conference.venue.postcode ? `, ${conference.venue.postcode}` : ''}</p>
							{/if}
							{#if conference.venue.country}
								<p>{conference.venue.country}</p>
							{/if}
						</div>
					</div>
				{/if}

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
</div>

<!-- Booking Form Modal -->
{#if showBookingForm}
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" 
		on:click={() => showBookingForm = false} 
		role="button" 
		tabindex="0" 
		on:keydown={(e) => e.key === 'Escape' && (showBookingForm = false)}
	>
		<div 
			class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" 
			on:click|stopPropagation 
			role="dialog"
		>
			<div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
				<h2 class="text-2xl font-bold">Book Now for {conference.title}</h2>
				<button
					on:click={() => showBookingForm = false}
					class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
					aria-label="Close registration form"
				>
					×
				</button>
			</div>
			<div class="p-6">
				{#key formKey}
					<ConferenceBookingForm
						conference={conference}
						ticketTypes={ticketTypes}
						isAuthenticated={isAuthenticated}
						on:close={() => showBookingForm = false}
					/>
				{/key}
			</div>
		</div>
	</div>
{/if}

<Footer contactInfo={data.contactInfo} />

