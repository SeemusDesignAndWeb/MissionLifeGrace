<script lang="js">
	import Footer from '$lib/components/Footer.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import { onMount, getContext } from 'svelte';

	export let data;
	export let params = {};

	let bannerVisible = false;
	
	// Get banner visibility from context
	try {
		const bannerVisibleStore = getContext('bannerVisible');
		if (bannerVisibleStore) {
			bannerVisibleStore.subscribe(value => {
				bannerVisible = value;
			});
		}
	} catch (e) {
		// Context not available
	}

	onMount(() => {
		// Component mounted
	});

	// Extract sections from page data
	$: sections = data.page?.sections || [];
	$: introSection = sections.find(s => s.type === 'text' && s.id === 'intro-section');
	$: events = data.events || [];
	$: services = data.services || [];

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { 
			day: 'numeric', 
			month: 'short', 
			year: 'numeric' 
		});
	}

	function formatTime(timeString) {
		if (!timeString) return '';
		const [hours, minutes] = timeString.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	}

	function getEventInfo(event) {
		const parts = [];
		if (event.date) parts.push(formatDate(event.date));
		if (event.time) parts.push(formatTime(event.time));
		if (event.location) parts.push(event.location);
		return parts.join(' • ');
	}
</script>

<svelte:head>
	<title>{data.page.title} - Mission Life Grace</title>
	<meta name="description" content={data.page.metaDescription || data.page.title} />
</svelte:head>

<!-- Hero Section -->
{#if data.page?.heroImage}
	<section
		id="hero"
		class="relative h-[35vh] overflow-hidden transition-all duration-300"
		class:mt-[5px]={bannerVisible}
		style="background-image: url('{data.page.heroImage}'); background-size: cover; background-position: center;"
	>
		<div
			class="absolute inset-0 bg-black"
			style="opacity: {(data.page.heroOverlay || 40) / 100};"
		></div>
		<div class="relative h-full flex items-end pb-12">
			<div class="container mx-auto px-4">
				<div class="max-w-2xl">
					{#if data.page.heroTitle}
						<h1 class="text-white text-4xl md:text-5xl font-bold mb-3 animate-fade-in">
							{@html data.page.heroTitle}
						</h1>
					{/if}
					{#if data.page.heroSubtitle}
						<p class="text-white text-lg md:text-xl mb-4 animate-fade-in">{data.page.heroSubtitle}</p>
					{/if}
					{#if data.page.heroButtons && data.page.heroButtons.length > 0}
						<div class="flex flex-wrap gap-3 mt-4">
							{#each data.page.heroButtons as button}
								<a
									href={button.link}
									target={button.target || '_self'}
									class="px-6 py-3 {button.style === 'secondary' ? 'bg-white text-primary hover:bg-gray-100' : 'bg-primary text-white hover:bg-opacity-90'} rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg text-sm"
								>
									{button.text}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>
{:else}
	<!-- Simple Header if no hero image -->
	<section class="py-16 bg-gradient-to-br from-primary via-brand-blue to-brand-cyan">
		<div class="container mx-auto px-4">
			<div class="max-w-3xl mx-auto text-center">
				{#if data.page?.heroTitle}
					<h1 class="text-white text-4xl md:text-6xl font-bold mb-4">
						{@html data.page.heroTitle}
					</h1>
				{:else}
					<h1 class="text-white text-4xl md:text-6xl font-bold mb-4">Events</h1>
				{/if}
				{#if data.page?.heroSubtitle}
					<p class="text-white text-lg md:text-xl">{data.page.heroSubtitle}</p>
				{:else if introSection?.content}
					<p class="text-white text-lg md:text-xl">{@html introSection.content.replace(/<[^>]*>/g, '').substring(0, 150)}</p>
				{/if}
			</div>
		</div>
	</section>
{/if}

<!-- Two Column Layout: Networking Events & Regular Events -->
<section class="py-16 bg-gray-50">
	<div class="container mx-auto px-4">
		<div class="max-w-7xl mx-auto">
			<!-- Section Header -->
			<div class="text-center mb-12">
				<span class="text-primary text-sm font-semibold uppercase tracking-wider mb-2 block">
					{data.page?.eventsSectionLabel || "What's Happening"}
				</span>
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
					{data.page?.eventsSectionTitle || "Events & Activities"}
				</h2>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					{data.page?.eventsSectionDescription || "Join us for training, networking, and community events"}
				</p>
			</div>

			<!-- Two Column Grid -->
			<div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
				<!-- Left Column: Training & Networking Events -->
				<div class="space-y-6">
					<div class="sticky top-4">
						<div class="mb-6 pb-4 border-b-2 border-primary/20">
							<h3 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
								<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
								</svg>
								Training & Networking
							</h3>
							<p class="text-sm text-gray-600">Equipping Leaders, Building Community</p>
						</div>

						{#if services.length === 0}
							<div class="text-center py-12 bg-white rounded-xl border border-gray-200">
								<svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
								</svg>
								<p class="text-gray-500 text-sm">No training events at this time</p>
							</div>
						{:else}
							<div class="space-y-4">
								{#each services as service}
									{@const serviceLink = service.url || (service.id ? `/services/${service.id}` : null)}
									{#if serviceLink}
										<a
											href={serviceLink}
											target={service.url && service.url.startsWith('http') ? '_blank' : '_self'}
											class="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-primary/50 block"
										>
											<div class="flex gap-4">
												<div class="relative w-32 flex-shrink-0">
													{#if service.image}
														<img
															src={service.image}
															alt={service.title}
															class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
														/>
													{:else}
														<div class="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center min-h-[100px]">
															<svg class="w-8 h-8 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
															</svg>
														</div>
													{/if}
												</div>
												<div class="flex-1 p-4">
													<h4 class="text-base font-bold mb-1 text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{service.title}</h4>
													{#if service.time}
														<div class="text-primary font-semibold text-xs mb-2 flex items-center gap-1">
															<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
															{service.time}
														</div>
													{/if}
													{#if service.description}
														<div class="text-gray-600 text-xs leading-relaxed line-clamp-2">
															{@html service.description.replace(/<[^>]*>/g, '').substring(0, 80)}...
														</div>
													{/if}
												</div>
											</div>
										</a>
									{:else}
										<div class="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
											<div class="flex gap-4">
												<div class="relative w-32 flex-shrink-0">
													{#if service.image}
														<img
															src={service.image}
															alt={service.title}
															class="w-full h-full object-cover min-h-[100px]"
														/>
													{:else}
														<div class="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center min-h-[100px]">
															<svg class="w-8 h-8 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
															</svg>
														</div>
													{/if}
												</div>
												<div class="flex-1 p-4">
													<h4 class="text-base font-bold mb-1 text-gray-900">{service.title}</h4>
													{#if service.time}
														<div class="text-primary font-semibold text-xs mb-2 flex items-center gap-1">
															<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
															{service.time}
														</div>
													{/if}
													{#if service.description}
														<div class="text-gray-600 text-xs leading-relaxed">
															{@html service.description}
														</div>
													{/if}
												</div>
											</div>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Column: Regular Events -->
				<div class="space-y-6">
					<div class="mb-6 pb-4 border-b-2 border-primary/20">
						<h3 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
							<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							Upcoming Events
						</h3>
						<p class="text-sm text-gray-600">Join us for upcoming events and gatherings</p>
					</div>

					{#if events.length === 0}
						<div class="text-center py-12 bg-white rounded-xl border border-gray-200">
							<svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<p class="text-gray-500 text-sm">No upcoming events at this time. Check back soon!</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each events as event}
								<a
									href="/events/{event.id}"
									class="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-primary/50 block"
								>
									<div class="flex gap-4">
										<div class="relative w-32 flex-shrink-0">
											{#if event.image}
												<img
													src={event.image}
													alt={event.title}
													class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 min-h-[100px]"
												/>
											{:else}
												<div class="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center min-h-[100px]">
													<svg class="w-8 h-8 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
													</svg>
												</div>
											{/if}
										</div>
										<div class="flex-1 p-4">
											<h4 class="text-base font-bold mb-1 text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h4>
											{#if getEventInfo(event)}
												<div class="flex items-center gap-2 text-primary font-semibold text-xs mb-2">
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
													</svg>
													<span class="line-clamp-1">{getEventInfo(event)}</span>
												</div>
											{/if}
											{#if event.description}
												<div class="text-gray-600 text-xs leading-relaxed line-clamp-2">
													{@html event.description.replace(/<[^>]*>/g, '').substring(0, 80)}...
												</div>
											{/if}
										</div>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Contact Section -->
<Contact contactInfo={data.contactInfo} />

<Footer />

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.6s ease-out;
	}

	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in-up {
		animation: fade-in-up 0.8s ease-out forwards;
		opacity: 0;
	}
</style>

