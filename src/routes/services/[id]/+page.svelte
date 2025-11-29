<script lang="js">
	import Footer from '$lib/components/Footer.svelte';
	import { getContext } from 'svelte';

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
</script>

<svelte:head>
	<title>{data.service.title} - Mission Life Grace</title>
	<meta name="description" content={data.service.description ? data.service.description.replace(/<[^>]*>/g, '').substring(0, 160) : data.service.title} />
</svelte:head>

<!-- Hero Section -->
{#if data.service.image}
	<section class="relative h-[35vh] overflow-hidden transition-all duration-300" class:mt-[5px]={bannerVisible}>
		<!-- Background Image with Blur -->
		<div
			class="absolute inset-0 bg-cover bg-center"
			style="background-image: url('{data.service.image}'); filter: blur(8px); transform: scale(1.1);"
		></div>
		<!-- Overlay -->
		<div class="absolute inset-0 bg-black bg-opacity-50"></div>
		<!-- Content -->
		<div class="relative h-full flex items-end pb-8 md:pb-12">
			<div class="container mx-auto px-4">
				<div class="max-w-3xl">
					<h1 class="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">{data.service.title}</h1>
					{#if data.service.time}
						<div class="flex items-center gap-2 text-white">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span class="text-lg font-medium">{data.service.time}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>
{:else}
	<section class="bg-gradient-to-r from-primary to-brand-blue py-20">
		<div class="container mx-auto px-4">
			<div class="max-w-3xl">
				<h1 class="text-white text-4xl md:text-5xl font-bold mb-4">{data.service.title}</h1>
				{#if data.service.time}
					<div class="flex items-center gap-2 text-white">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span class="text-lg font-medium">{data.service.time}</span>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/if}

<!-- Service Details -->
<section class="py-20 bg-white">
	<div class="container mx-auto px-4">
		<div class="max-w-4xl mx-auto">
			<div class="grid md:grid-cols-3 gap-8">
				<!-- Main Content -->
				<div class="md:col-span-2">
					{#if data.service.description}
						<div class="prose prose-lg max-w-none mb-8">
							{@html data.service.description}
						</div>
					{/if}
				</div>

				<!-- Sidebar -->
				<div class="md:col-span-1">
					<div class="bg-gray-50 rounded-lg p-6 sticky top-4">
						<h2 class="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>
						
						<div class="space-y-4">
							{#if data.service.time}
								<div class="flex items-start gap-3">
									<svg class="w-6 h-6 text-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<div>
										<div class="text-sm text-gray-600">Time</div>
										<div class="font-semibold text-gray-900">{data.service.time}</div>
									</div>
								</div>
							{/if}
						</div>

						<div class="mt-8 pt-6 border-t border-gray-200">
							<h3 class="font-semibold text-gray-900 mb-3">Need more information?</h3>
							<a
								href="/#contact"
								class="block w-full text-center px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-opacity-90 transition-all"
							>
								Contact Us
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<Footer contactInfo={data.contactInfo} />

