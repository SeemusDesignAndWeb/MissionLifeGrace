<script lang="js">
	import Footer from '$lib/components/Footer.svelte';
	import HeroSlides from '$lib/components/HeroSlides.svelte';
	import { onMount } from 'svelte';

	export let data;
	export let params = {};

	// Extract values section from page data
	$: valuesSection = data.page?.sections?.find(s => s.type === 'values');
	$: values = valuesSection?.values || [];

	let mounted = false;
	let expandedCards = new Set();
	let mousePositions = new Map(); // Track mouse position for each card

	onMount(() => {
		mounted = true;
	});

	// Function to get excerpt (first 120 characters of plain text)
	function getExcerpt(text) {
		if (!text) return '';
		// Remove HTML tags for length calculation
		const plainText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
		if (plainText.length <= 120) return text;
		// Find the last space before 120 characters to avoid cutting words
		const truncated = plainText.substring(0, 120);
		const lastSpace = truncated.lastIndexOf(' ');
		const excerptLength = lastSpace > 0 ? lastSpace : 120;
		
		// Create a temporary element to parse HTML and extract text
		// For excerpt, we'll create a simple version
		// Strip HTML, get excerpt, then add ellipsis
		const excerptText = plainText.substring(0, excerptLength);
		
		// Try to preserve paragraph structure if it exists
		if (text.includes('<p>')) {
			return `<p>${excerptText}...</p>`;
		}
		return excerptText + '...';
	}

	// Function to check if text needs truncation
	function needsTruncation(text) {
		if (!text) return false;
		const plainText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
		return plainText.length > 120;
	}

	function toggleCard(index) {
		if (expandedCards.has(index)) {
			expandedCards.delete(index);
		} else {
			expandedCards.add(index);
		}
		expandedCards = expandedCards; // Trigger reactivity
	}

	function isExpanded(index) {
		return expandedCards.has(index);
	}

	// Generate smooth gradient colors across all values
	// Using MLG gradient: primary (#0693ad) -> brand-blue (#1384b6) -> brand-cyan (#00a79d)
	function getGradientColor(index, total, mouseX = null, mouseY = null) {
		// Create a smooth transition across the gradient
		const position = index / Math.max(1, total - 1); // 0 to 1
		
		// Calculate gradient angle based on mouse position
		let angle = 135; // Default angle
		if (mouseX !== null && mouseY !== null) {
			// Convert mouse position to angle (0-360 degrees)
			// Assuming mouseX and mouseY are relative to card center (0-100%)
			const centerX = 50;
			const centerY = 50;
			const deltaX = mouseX - centerX;
			const deltaY = mouseY - centerY;
			angle = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90 + 360) % 360;
		}
		
		// For each card, create a unique gradient by rotating through the color space
		if (position < 0.33) {
			// Early cards: more primary to brand-blue
			const t = position / 0.33;
			return {
				bg: `linear-gradient(${angle}deg, #0693ad ${0 + t * 50}%, #1384b6 ${50 + t * 30}%, #00a79d ${100}%)`,
				accent: '#0693ad',
				text: 'text-white',
				shadow: 'shadow-primary/20'
			};
		} else if (position < 0.66) {
			// Middle cards: more brand-blue to brand-cyan
			const t = (position - 0.33) / 0.33;
			return {
				bg: `linear-gradient(${angle}deg, #1384b6 ${0}%, #00a79d ${t * 50}%, #0693ad ${100 - t * 30}%)`,
				accent: '#1384b6',
				text: 'text-white',
				shadow: 'shadow-brand-blue/20'
			};
		} else {
			// Later cards: more brand-cyan to primary
			const t = (position - 0.66) / 0.34;
			return {
				bg: `linear-gradient(${angle}deg, #00a79d ${0}%, #0693ad ${t * 40}%, #1384b6 ${100 - t * 20}%)`,
				accent: '#00a79d',
				text: 'text-white',
				shadow: 'shadow-brand-cyan/20'
			};
		}
	}

	function handleMouseMove(event, index) {
		const card = event.currentTarget;
		const rect = card.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;
		mousePositions.set(index, { x, y });
		mousePositions = mousePositions; // Trigger reactivity
	}

	function handleMouseLeave(index) {
		mousePositions.delete(index);
		mousePositions = mousePositions; // Trigger reactivity
	}
</script>

<svelte:head>
	<title>{data.page?.title || 'Our Values'} - Mission Life Grace</title>
	<meta name="description" content={data.page?.metaDescription || data.page?.title || 'Mission Life Grace'} />
	{#if data.page?.keywords}
		<meta name="keywords" content={data.page.keywords} />
	{/if}
</svelte:head>

<!-- Hero Slides -->
<HeroSlides heroSlides={data.heroSlides} />

<!-- Values Section Description (if exists, shown below hero) -->
{#if valuesSection?.description}
	<section class="relative py-12 md:py-16 overflow-hidden">
		<!-- Background with gradient -->
		<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-brand-blue/5 to-brand-cyan/5"></div>
		
		<!-- Decorative elements -->
		<div class="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
		<div class="absolute bottom-0 right-0 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
		
		<div class="container mx-auto px-4 relative z-10">
			<div class="max-w-5xl mx-auto">
				<!-- Section Header -->
				<div class="text-center mb-8">
					<div class="inline-block mb-4">
						<span class="text-primary text-sm font-semibold uppercase tracking-wider">Our Foundation</span>
					</div>
					{#if valuesSection.title}
						<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
							{@html valuesSection.title}
						</h2>
					{/if}
				</div>
				
				<!-- Main Content Card -->
				<div class="relative">
					<!-- Decorative border gradient -->
					<div class="absolute -inset-1 bg-gradient-to-r from-primary via-brand-blue to-brand-cyan rounded-2xl blur opacity-20"></div>
					
					<!-- Content container -->
					<div class="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-gray-100">
						<!-- Quote icon decoration -->
						<div class="absolute top-6 left-6 opacity-5">
							<svg class="w-24 h-24 text-primary" fill="currentColor" viewBox="0 0 24 24">
								<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
							</svg>
						</div>
						
						<!-- Content -->
						<div class="relative z-10">
							<div class="prose prose-lg md:prose-xl max-w-none text-gray-700 leading-relaxed">
								{@html valuesSection.description}
							</div>
							
							<!-- Accent line -->
							<div class="mt-8 pt-8 border-t border-gray-200">
								<div class="flex items-center gap-4">
									<div class="flex-1 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
									<div class="w-2 h-2 rounded-full bg-primary"></div>
									<div class="flex-1 h-px bg-gradient-to-r from-transparent via-brand-cyan to-transparent"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- Values Grid Section -->
{#if values && values.length > 0}
	<section class="py-12 md:py-16 bg-gradient-to-b from-gray-50 via-white to-gray-50">
		<div class="container mx-auto px-4">
			<div class="max-w-7xl mx-auto">
				<!-- Staggered Grid Layout -->
				<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
					{#each values as value, index}
						{@const mousePos = mousePositions.get(index)}
						{@const colors = getGradientColor(index, values.length, mousePos?.x, mousePos?.y)}
						{@const delay = index * 100}
						{@const isExpanded = expandedCards.has(index)}
						{@const needsMore = needsTruncation(value.description)}
						<div
							class="group relative overflow-hidden rounded-2xl {colors.shadow} shadow-xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
							style="background: {colors.bg}; animation-delay: {delay}ms; opacity: {mounted ? 1 : 0}; transform: translateY({mounted ? 0 : 30}px); transition: opacity 0.6s ease-out, transform 0.6s ease-out, background 0.3s ease-out;"
							on:mousemove={(e) => handleMouseMove(e, index)}
							on:mouseleave={() => handleMouseLeave(index)}
						>
							<!-- Decorative Pattern -->
							<div class="absolute inset-0 opacity-10">
								<div class="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
								<div class="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-xl"></div>
							</div>

							<!-- Content -->
							<div class="relative z-10 p-6 md:p-8 {colors.text} flex flex-col">
								<!-- Number Badge -->
								<div class="mb-4">
									<div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30">
										<span class="text-xl font-bold">{index + 1}</span>
									</div>
								</div>

								<!-- Title -->
								{#if value.title}
									<h3 class="text-2xl md:text-3xl font-bold mb-3 leading-tight text-white">
										{@html value.title}
									</h3>
								{/if}

								<!-- Description -->
								{#if value.description}
									<div class="text-base md:text-lg leading-relaxed flex-grow opacity-95 mb-4">
										{#if isExpanded || !needsMore}
											{@html value.description}
										{:else}
											{@html getExcerpt(value.description)}
										{/if}
									</div>
								{:else}
									<div class="text-base opacity-75 italic flex-grow mb-4">Description coming soon...</div>
								{/if}

								<!-- Show More/Less Button -->
								{#if needsMore}
									<button
										on:click={() => toggleCard(index)}
										class="mt-auto pt-4 border-t border-white/20 text-sm font-semibold {colors.text} hover:opacity-80 transition-opacity duration-200 flex items-center gap-2 group/btn"
									>
										<span>{isExpanded ? 'Show Less' : 'Show More'}</span>
										<svg
											class="w-4 h-4 transform transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
										</svg>
									</button>
								{/if}

								<!-- Bottom Accent Line -->
								<div class="mt-4 pt-4 border-t border-white/20">
									<div class="w-12 h-0.5 bg-white/50 rounded-full transform group-hover:w-full transition-all duration-500"></div>
								</div>
							</div>

							<!-- Hover Effect Overlay -->
							<div class="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-500"></div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- Call to Action Section -->
<section class="py-20 bg-gradient-to-r from-primary via-brand-blue to-brand-cyan">
	<div class="container mx-auto px-4">
		<div class="max-w-4xl mx-auto text-center">
			<h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
				Living Out Our Values Together
			</h2>
			<p class="text-xl text-white/90 mb-8 leading-relaxed">
				These values shape everything we do as a network of churches. We invite you to join us as we live out these principles in our communities and beyond.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href="/contact"
					class="px-8 py-4 bg-white text-primary rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
				>
					Get in Touch
				</a>
				<a
					href="/church"
					class="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
				>
					Learn More About Us
				</a>
			</div>
		</div>
	</div>
</section>

<Footer contactInfo={data.contactInfo} />

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
