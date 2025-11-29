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
	
	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
						<div class="mt-6">
							<button
								on:click={() => showBookingForm = true}
								class="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
								</svg>
								Book Now
							</button>
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
							<div class="mt-6">
								<button
									on:click={() => showBookingForm = true}
									class="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-primary text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
									</svg>
									Book Now
								</button>
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
		<div class="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto">
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
