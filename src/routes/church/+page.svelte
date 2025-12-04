<script lang="js">
	import Footer from '$lib/components/Footer.svelte';
	import HeroSlides from '$lib/components/HeroSlides.svelte';
	import { onMount } from 'svelte';

	export let data;
	export let params = {};

	onMount(() => {
		// Component mounted
	});

	// Extract sections from page data
	$: sections = data.page?.sections || [];
	$: historySection = sections.find((s, i) => s.type === 'text' && i === 0);
	$: otherSections = sections.filter((s, i) => s.type === 'text' && i > 0);
	$: valuesSection = sections.find(s => s.type === 'values');
	$: mlgSection = sections.find(s => s.type === 'mlg');
	
	// Debug logging in browser console
	$: {
		if (typeof window !== 'undefined') {
			console.log('[Church Page Frontend] Sections:', {
				total: sections.length,
				historySection: historySection ? { 
					type: historySection.type, 
					title: historySection.title, 
					hasContent: !!historySection.content,
					contentPreview: historySection.content?.substring(0, 100) || 'no content'
				} : null,
				otherSectionsCount: otherSections.length,
				otherSections: otherSections.map(s => ({
					type: s.type,
					title: s.title,
					hasContent: !!s.content,
					contentPreview: s.content?.substring(0, 50) || 'no content'
				})),
				valuesSection: valuesSection ? { 
					type: valuesSection.type, 
					title: valuesSection.title, 
					valuesCount: valuesSection.values?.length || 0,
					firstValue: valuesSection.values?.[0]?.title || 'no values'
				} : null
			});
		}
	}
</script>

<svelte:head>
	<title>{data.page?.title || 'Church'} - Mission Life Grace</title>
	<meta name="description" content={data.page?.metaDescription || data.page?.title || 'Mission Life Grace'} />
	{#if data.page?.keywords}
		<meta name="keywords" content={data.page.keywords} />
	{/if}
</svelte:head>

<!-- Hero Slides -->
<HeroSlides heroSlides={data.heroSlides} />

<!-- History Section -->
{#if historySection}
	<section class="relative py-24 md:py-32 overflow-hidden">
		<!-- Background with gradient overlay -->
		<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-brand-blue/5"></div>
		
		<!-- Decorative elements -->
		<div class="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
		<div class="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
		
		<div class="relative container mx-auto px-4">
			<div class="max-w-7xl mx-auto">
				<div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
					<!-- Content Side - Left -->
					<div class="order-2 lg:order-1">
						<div class="space-y-6 text-left">
							<!-- Label -->
							<div class="inline-flex items-center gap-2">
								<div class="h-px w-12 bg-gradient-to-r from-primary to-brand-blue"></div>
								<span class="text-primary text-sm font-semibold uppercase tracking-wider">Our Story</span>
							</div>
							
							<!-- Title -->
							{#if historySection.title}
								<h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-left">
									{@html historySection.title}
								</h2>
							{/if}
							
							<!-- Content -->
							{#if historySection.content}
								<div class="prose prose-lg max-w-none text-gray-700 leading-relaxed [&_p]:text-left [&_h1]:text-left [&_h2]:text-left [&_h3]:text-left [&_h4]:text-left [&_ul]:text-left [&_ol]:text-left [&_li]:text-left">
									{@html historySection.content}
								</div>
							{/if}
							
							<!-- Decorative line -->
							<div class="pt-6">
								<div class="h-1 w-24 bg-gradient-to-r from-primary via-brand-blue to-brand-cyan rounded-full"></div>
							</div>
						</div>
					</div>
					
					<!-- Image Side - Right -->
					<div class="order-1 lg:order-2">
						<div class="relative group">
							<!-- Main Image Container -->
							<div class="relative overflow-hidden rounded-3xl shadow-2xl transform transition-all duration-500 group-hover:scale-[1.02]">
								{#if historySection.image}
									<img
										src={historySection.image}
										alt={historySection.title || "Eltham Green Community Church"}
										class="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
									/>
								{:else}
									<img
										src="https://res.cloudinary.com/dl8kjhwjs/image/upload/v1763066407/egcc/egcc/page-hero-church.jpg"
										alt="Eltham Green Community Church"
										class="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
									/>
								{/if}
								<!-- Gradient overlay on hover -->
								<div class="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							</div>
							
							<!-- Decorative accent -->
							<div class="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-primary to-brand-blue rounded-2xl opacity-20 blur-xl transform -rotate-12 group-hover:-rotate-6 transition-transform duration-500"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{/if}


<!-- Values Section -->
{#if valuesSection}
	<section class="py-20 bg-gradient-to-b from-white to-gray-50">
		<div class="container mx-auto px-4">
			<div class="max-w-6xl mx-auto">
				<div class="text-center mb-16">
					<span class="text-primary text-sm font-semibold uppercase tracking-wider mb-2 block">What Makes Us Who We Are</span>
					{#if valuesSection.title}
						<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
							{valuesSection.title}
						</h2>
					{/if}
					{#if valuesSection.description}
						<p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
							{valuesSection.description}
						</p>
					{/if}
				</div>
				{#if valuesSection.values && valuesSection.values.length > 0}
					<div class="grid md:grid-cols-2 gap-8 mb-12">
						{#each valuesSection.values as value, index}
							{@const colorClasses = [
								{ bg: 'bg-primary/10', border: 'border-primary', title: 'text-primary' },
								{ bg: 'bg-brand-blue/10', border: 'border-brand-blue', title: 'text-brand-blue' },
								{ bg: 'bg-brand-yellow/10', border: 'border-brand-yellow', title: 'text-brand-yellow' },
								{ bg: 'bg-brand-red/10', border: 'border-brand-red', title: 'text-brand-red' },
								{ bg: 'bg-primary/10', border: 'border-primary', title: 'text-primary' },
								{ bg: 'bg-brand-blue/10', border: 'border-brand-blue', title: 'text-brand-blue' },
								{ bg: 'bg-brand-yellow/10', border: 'border-brand-yellow', title: 'text-brand-yellow' }
							]}
							{@const colors = colorClasses[index % colorClasses.length]}
							<div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 {colors.border} transform hover:-translate-y-2">
								<div class="flex items-start gap-4 mb-4">
									<div class="w-12 h-12 {colors.bg} rounded-full flex items-center justify-center flex-shrink-0">
										<span class="text-xl font-bold {colors.title}">{index + 1}</span>
									</div>
									<div class="flex-1">
										{#if value.title}
											<h3 class="text-2xl md:text-3xl font-bold {colors.title} mb-3 leading-tight">
												{value.title}
											</h3>
										{/if}
									</div>
								</div>
								{#if value.description}
									<p class="text-gray-600 leading-relaxed">
										{value.description}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
				
				<!-- What We Believe Box -->
				<div class="bg-gradient-to-br from-primary/10 via-brand-blue/10 to-primary/10 border-2 border-primary rounded-2xl p-8 text-center shadow-lg">
					<h3 class="text-2xl font-bold text-gray-900 mb-4">What We Believe</h3>
					<p class="text-gray-700 mb-6 max-w-2xl mx-auto">
						We agree with the Evangelical Alliance statement of faith.
					</p>
					<a
						href="https://www.eauk.org/about-us/how-we-work/basis-of-faith"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-block px-8 py-4 bg-primary text-white rounded-full font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
					>
						Read Statement of Faith
					</a>
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- Mission Life Grace Section -->
{#if mlgSection}
	<section class="py-20 bg-gradient-to-br from-gray-50 to-white">
		<div class="container mx-auto px-4">
			<div class="max-w-4xl mx-auto">
				<div class="text-center mb-12">
					{#if mlgSection.logo}
						<div class="mb-6 flex justify-center">
							<img
								src={mlgSection.logo}
								alt="Mission Life Grace"
								class="h-24 md:h-32 w-auto"
							/>
						</div>
					{/if}
					{#if mlgSection.label}
						<span class="text-primary text-sm font-semibold uppercase tracking-wider mb-2 block">
							{mlgSection.label}
						</span>
					{/if}
					{#if mlgSection.title}
						<h2 class="text-2xl md:text-4xl font-bold text-gray-900 mb-6">
							{@html mlgSection.title}
						</h2>
					{/if}
				</div>
				{#if mlgSection.content}
					<div class="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-8 text-center">
						{@html mlgSection.content}
					</div>
				{/if}
				<div class="text-center">
					<a
						href="https://www.missionlifegrace.net/"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-block px-8 py-4 bg-primary text-white rounded-full font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
					>
						{mlgSection.buttonText || 'Visit Mission Life Grace'}
					</a>
				</div>
			</div>
		</div>
	</section>
{:else}
	<!-- Fallback MLG section if not in database -->
	<section class="py-20 bg-gradient-to-br from-gray-50 to-white">
		<div class="container mx-auto px-4">
			<div class="max-w-4xl mx-auto">
				<div class="text-center mb-12">
					<div class="mb-6 flex justify-center">
						<img
							src="https://res.cloudinary.com/dl8kjhwjs/image/upload/v1763397479/egcc/d79861b6-c071-4bb9-9665-299a4a7d20bf.svg"
							alt="Mission Life Grace"
							class="h-24 md:h-32 w-auto"
						/>
					</div>
					<span class="text-primary text-sm font-semibold uppercase tracking-wider mb-2 block">
						Partnership
					</span>
					<h2 class="text-2xl md:text-4xl font-bold text-gray-900 mb-6">
						Part of the MissionLifeGrace Network
					</h2>
				</div>
				<div class="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-8 text-center">
					<p>
						Our aim is to see the Kingdom of God come, where broken lives are restored, the lost are found and communities transformed. We believe every church exists to be part of God's mission to show the world Christ and that we are better equipped to do this in partnership with other churches.
					</p>
					<p>
						As a network our focus is to encourage each other through sharing our hearts, ideas and lessons learned along the way, to challenge one another to stay true to the course and to invest in helping people fulfil their God given calling. We believe that by journeying together we can see God do great things in our nation and around the world.
					</p>
				</div>
				<div class="text-center">
					<a
						href="https://www.missionlifegrace.net/"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-block px-8 py-4 bg-primary text-white rounded-full font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
					>
						Visit Mission Life Grace
					</a>
				</div>
			</div>
		</div>
	</section>
{/if}

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
</style>
