<script lang="js">
	import Team from '$lib/components/Team.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import HeroSlides from '$lib/components/HeroSlides.svelte';

	export let data;
	export let params = {};

	// Extract sections from page data
	$: sections = data.page?.sections || [];
</script>

<svelte:head>
	<title>{data.page?.title || 'Our Team'} - Mission Life Grace</title>
	<meta name="description" content={data.page?.metaDescription || data.page?.title || 'Mission Life Grace'} />
	{#if data.page?.keywords}
		<meta name="keywords" content={data.page.keywords} />
	{/if}
</svelte:head>

<!-- Hero Slides -->
<HeroSlides heroSlides={data.heroSlides} />

<!-- Team Members Section -->
<Team teamDescription={data.page?.teamDescription || ''} team={data.team} teamTitle={data.page?.heroTitle || data.page?.title || ''} />

<!-- Page Sections -->
{#each sections as section, sectionIndex}
	{#if section.type === 'text'}
		<section class="py-20 {sectionIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
			<div class="container mx-auto px-4">
				<div class="max-w-6xl mx-auto">
					{#if section.image}
						<div class="grid md:grid-cols-2 gap-12 items-center">
							<div class="order-2 md:order-1">
								{#if section.title}
									<h2 class="text-4xl font-bold text-gray-900 mb-4">
										{@html section.title}
									</h2>
								{/if}
								{#if section.content}
									<div class="prose prose-lg max-w-none text-gray-700 leading-relaxed">
										{@html section.content}
									</div>
								{/if}
								{#if section.cta && section.cta.link && section.cta.text}
									<div class="mt-6">
										<a
											href={section.cta.link}
											target={section.cta.target || '_self'}
											class="inline-block px-6 py-3 bg-brand-blue text-white rounded-full font-semibold hover:bg-opacity-90 transition-colors"
										>
											{section.cta.text}
										</a>
									</div>
								{/if}
							</div>
							<div class="order-1 md:order-2 flex justify-center md:justify-end">
								<div class="relative w-full max-w-lg">
									<div class="absolute -inset-4 bg-primary/20 rounded-full transform rotate-3"></div>
									<!-- Circular accent -->
									<div class="absolute top-4 right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl"></div>
									<img
										src={section.image}
										alt={section.title || "Section image"}
										class="relative rounded-2xl shadow-2xl w-full h-auto"
									/>
								</div>
							</div>
						</div>
					{:else}
						<div class="max-w-4xl mx-auto text-center">
							{#if section.title}
								<h2 class="text-4xl font-bold text-gray-900 mb-4">
									{@html section.title}
								</h2>
							{/if}
							{#if section.content}
								<div class="prose prose-lg max-w-none text-gray-700 leading-relaxed">
									{@html section.content}
								</div>
							{/if}
							{#if section.cta && section.cta.link && section.cta.text}
								<div class="mt-6">
									<a
										href={section.cta.link}
										target={section.cta.target || '_self'}
										class="inline-block px-6 py-3 bg-brand-blue text-white rounded-full font-semibold hover:bg-opacity-90 transition-colors"
									>
										{section.cta.text}
									</a>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</section>
	{/if}
{/each}

<Contact contactInfo={data.contactInfo} />

<Footer />

