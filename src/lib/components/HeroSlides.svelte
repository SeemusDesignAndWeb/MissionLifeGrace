<script lang="js">
	import { onMount, getContext } from 'svelte';

	export let heroSlides = null;

	let currentSlide = 0;
	let autoplayInterval = null;
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

	// Fallback slides if none in database
	const defaultSlides = [
		{
			id: 'default-1',
			title: 'Mission Life Grace',
			subtitle: 'Churches on mission together',
			cta: 'Learn more',
			ctaLink: '#about-us',
			image: 'https://res.cloudinary.com/dsnceqtza/image/upload/v1763390998/mission-life-grace/375d5fb3-6856-49be-a8d1-48859a442bca.jpg'
		}
	];

	$: slides = heroSlides && heroSlides.length > 0 ? heroSlides : defaultSlides;

	function nextSlide() {
		currentSlide = (currentSlide + 1) % slides.length;
	}

	function goToSlide(index) {
		currentSlide = index;
	}

	function smoothScroll(e, targetId) {
		e.preventDefault();
		const element = document.getElementById(targetId);
		if (element) {
			const offset = 49;
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - offset;
			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	}

	onMount(() => {
		if (slides.length > 1) {
			autoplayInterval = window.setInterval(nextSlide, 5000);
		}
		return () => {
			if (autoplayInterval) window.clearInterval(autoplayInterval);
		};
	});
</script>

<section id="hero" class="relative h-[50vh] overflow-hidden transition-all duration-300" class:mt-[5px]={bannerVisible}>
	{#each slides as slide, index}
		<div
			class="absolute inset-0 transition-opacity duration-1000"
			class:opacity-0={currentSlide !== index}
			class:opacity-100={currentSlide === index}
			style="background-image: url('{slide.image}'); background-size: cover; background-position: center;"
		>
			<div class="absolute inset-0 bg-black bg-opacity-40"></div>
			<!-- Circular decorative elements -->
			<div class="absolute top-10 right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-60"></div>
			<div class="absolute bottom-10 left-10 w-32 h-32 bg-brand-blue/20 rounded-full blur-2xl opacity-50"></div>
			<div class="relative h-full flex items-center py-8 md:py-0">
				<div class="container mx-auto px-4 w-full">
					<div class="max-w-3xl">
						{#if slide.title}
							<p class="text-white text-base md:text-xl lg:text-2xl font-light mb-2 md:mb-4 animate-fade-in">
								{slide.title}
							</p>
						{/if}
						{#if slide.subtitle}
							<h1 class="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-8 leading-tight animate-fade-in">
								{slide.subtitle}
							</h1>
						{/if}
						{#if slide.cta}
							<a
								href={slide.ctaLink}
								on:click={(e) => {
									if (slide.ctaLink && slide.ctaLink.startsWith('#')) {
										smoothScroll(e, slide.ctaLink.slice(1));
									}
								}}
								class="inline-block bg-primary text-white px-6 py-2 md:px-8 md:py-4 rounded-full text-sm md:text-base font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg animate-fade-in"
							>
								{slide.cta}
							</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/each}

	<!-- Slide indicators -->
	{#if slides.length > 1}
		<div class="hidden md:flex absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 gap-2 z-10">
			{#each slides as _, index}
				<button
					on:click={() => goToSlide(index)}
					class="w-3 h-3 rounded-full transition-all {currentSlide === index ? 'bg-white' : 'bg-white/50'}"
					aria-label="Go to slide {index + 1}"
				></button>
			{/each}
		</div>
	{/if}
</section>

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

	.animate-fade-in {
		animation: fade-in 1s ease-out;
	}
</style>

