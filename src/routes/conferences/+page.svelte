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
	$: conferences = data.conferences || [];

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { 
			day: 'numeric', 
			month: 'short', 
			year: 'numeric' 
		});
	}

	function formatDateRange(startDate, endDate) {
		if (!startDate) return '';
		if (!endDate || startDate === endDate) {
			return formatDate(startDate);
		}
		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
			return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
		}
		return `${formatDate(startDate)} - ${formatDate(endDate)}`;
	}

	function getConferenceInfo(conference) {
		const parts = [];
		if (conference.startDate) {
			parts.push(formatDateRange(conference.startDate, conference.endDate));
		}
		if (conference.venue && conference.venue.name) {
			parts.push(conference.venue.name);
		}
		return parts.join(' • ');
	}

	function getImageUrl(conference) {
		if (conference.images && conference.images.length > 0) {
			return conference.images[0];
		}
		return null;
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
			style="opacity: {(data.page.heroOverlay || 20) / 100};"
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
									class="px-6 py-3 {button.style === 'secondary' ? 'bg-white text-brand-blue hover:bg-gray-100' : 'bg-brand-blue text-white hover:bg-opacity-90'} rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg text-sm"
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
{/if}

<!-- Intro Section -->
{#if introSection}
	<section class="py-20 bg-gradient-to-b from-white to-gray-50">
		<div class="container mx-auto px-4">
			<div class="max-w-6xl mx-auto">
				<div class="grid md:grid-cols-2 gap-12 items-center">
					<div class="order-2 md:order-1">
						<div class="inline-block mb-4">
							<span class="text-brand-blue text-sm font-semibold uppercase tracking-wider">Conferences</span>
						</div>
						{#if introSection.title}
							<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
								{@html introSection.title}
							</h2>
						{/if}
						{#if introSection.content}
							<div class="prose prose-lg max-w-none text-gray-700 leading-relaxed">
								{@html introSection.content}
							</div>
						{/if}
					</div>
					<div class="order-1 md:order-2 flex justify-center md:justify-end">
						<div class="relative w-full max-w-lg">
							<div class="absolute -inset-4 bg-brand-blue/20 rounded-full transform rotate-3"></div>
							<div class="relative bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 rounded-2xl p-12 shadow-2xl">
								<!-- Circular accent -->
								<div class="absolute top-4 right-4 w-16 h-16 bg-brand-blue/20 rounded-full blur-xl"></div>
								<div class="text-center relative z-10">
									<svg class="w-24 h-24 text-brand-blue mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<h3 class="text-2xl font-bold text-gray-900 mb-2">Upcoming Conferences</h3>
									<p class="text-gray-600">Join us for inspiring conferences and gatherings</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- Conferences Grid -->
<section class="py-20 bg-gray-900">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<span class="text-brand-blue text-sm font-semibold uppercase tracking-wider mb-2 block">What We Offer</span>
			<h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
				Conferences
			</h2>
			<p class="text-xl text-gray-300 max-w-2xl mx-auto">
				Join us for upcoming conferences and gatherings
			</p>
		</div>

		{#if conferences.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg">No upcoming conferences at this time. Check back soon!</p>
			</div>
		{:else}
			<div class="grid md:grid-cols-3 gap-8">
				{#each conferences as conference, index}
					<a
						href="/conference/{conference.slug}"
						class="group relative animate-fade-in-up bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-2 block"
						style="animation-delay: {index * 0.1}s"
					>
						<div class="relative overflow-hidden aspect-[2/1]">
							{#if getImageUrl(conference)}
								<img
									src={getImageUrl(conference)}
									alt={conference.title}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
								/>
							{:else}
								<div class="w-full h-full bg-gradient-to-br from-brand-blue/20 to-brand-blue/10 flex items-center justify-center">
									<svg class="w-24 h-24 text-brand-blue/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
							{/if}
							<div
								class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
							>
								<div class="text-white text-center">
									<span class="text-lg font-semibold">Register Now →</span>
								</div>
							</div>
							{#if conference.registrationOpen}
								<div class="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
									Registration Open
								</div>
							{/if}
						</div>
						<div class="p-6">
							<h3 class="text-xl font-bold mb-2 text-white">{conference.title}</h3>
							{#if getConferenceInfo(conference)}
								<div class="text-brand-blue font-bold text-sm mb-3">{getConferenceInfo(conference)}</div>
							{/if}
							{#if conference.description}
								<div class="text-gray-300 text-sm leading-relaxed line-clamp-3">
									{@html conference.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
								</div>
							{/if}
							<div class="mt-4 pt-4 border-t border-gray-700">
								<span class="text-brand-blue text-sm font-semibold">Learn More & Register →</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Call to Action -->
<section class="py-20 bg-gradient-to-br from-brand-blue/5 via-white to-gray-50">
	<div class="container mx-auto px-4">
		<div class="max-w-4xl mx-auto text-center">
			<div class="inline-block mb-4">
				<span class="text-brand-blue text-sm font-semibold uppercase tracking-wider">Join Us</span>
			</div>
			<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
				We Look Forward to Welcoming You!
			</h2>
			<p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
				Join us for upcoming conferences and gatherings. Come and be part of what we're doing.
			</p>
			<a
				href="#contact"
				class="inline-block px-8 py-4 bg-brand-blue text-white rounded-full font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
			>
				Get in Touch
			</a>
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

