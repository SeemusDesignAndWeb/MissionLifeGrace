<script lang="js">
	import { onMount, getContext } from 'svelte';

	export let heroImage = null;
	export let heroTitle = null;
	export let heroSubtitle = null;
	export let heroButtons = [];
	export let heroMessages = [];
	export let heroOverlay = 40;
	export let heroHeight = 'h-[30vh] md:h-[35vh]';

	let bannerVisible = false;
	let currentMessage = 0;
	let autoplayInterval = null;

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
		if (heroMessages && heroMessages.length > 0) {
			autoplayInterval = window.setInterval(() => {
				currentMessage = (currentMessage + 1) % heroMessages.length;
			}, 4000);
		}
		return () => {
			if (autoplayInterval) window.clearInterval(autoplayInterval);
		};
	});
</script>

{#if heroImage}
	<section
		id="hero"
		class="relative {heroHeight} overflow-hidden transition-all duration-300"
		class:mt-[5px]={bannerVisible}
		style="background-image: url('{heroImage}'); background-size: cover; background-position: center;"
	>
		<div
			class="absolute inset-0 bg-black"
			style="opacity: {(heroOverlay || 40) / 100};"
		></div>
		<!-- Circular decorative elements -->
		<div class="absolute top-20 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
		<div class="absolute bottom-20 left-10 w-24 h-24 bg-brand-blue/10 rounded-full blur-2xl opacity-40"></div>
		<div class="relative h-full flex items-end pb-12">
			<div class="container mx-auto px-4">
				<div class="max-w-2xl">
					{#if heroTitle}
						<h1 class="text-white text-4xl md:text-5xl font-bold mb-3 animate-fade-in">
							{@html heroTitle}
						</h1>
					{/if}
					{#if heroSubtitle}
						<p class="text-white text-lg md:text-xl mb-3 animate-fade-in">
							{heroSubtitle}
						</p>
					{/if}
					{#if heroMessages && heroMessages.length > 0}
						<div class="relative h-12 mb-4">
							{#each heroMessages as msg, index}
								<div
									class="absolute inset-0 transition-opacity duration-1000"
									class:opacity-0={currentMessage !== index}
									class:opacity-100={currentMessage === index}
								>
									<p class="text-white text-lg md:text-xl font-light animate-fade-in">
										{msg}
									</p>
								</div>
							{/each}
						</div>
					{/if}
					{#if heroButtons && heroButtons.length > 0}
						<div class="flex flex-wrap gap-3 mt-4">
							{#each heroButtons as button}
								<a
									href={button.link || button.url}
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
</style>

