<script lang="ts">
	import { onMount } from 'svelte';

	let currentSlide = 0;
	let autoplayInterval: number | null = null;

	const slides = [
		{
			title: 'Eltham Green Community Church',
			subtitle: 'A welcoming community of faith, hope, and love',
			cta: 'Join Us',
			ctaLink: '#services',
			image: '/images/slider-image1.jpg'
		},
		{
			title: 'Sunday Worship',
			subtitle: 'Join us every Sunday for inspiring worship and fellowship',
			cta: 'Service Times',
			ctaLink: '#services',
			image: '/images/slider-image2.jpg'
		},
		{
			title: 'Community & Connection',
			subtitle: 'Building relationships and serving our community together',
			cta: 'Get Involved',
			ctaLink: '#contact',
			image: '/images/slider-image3.jpg'
		}
	];

	function nextSlide() {
		currentSlide = (currentSlide + 1) % slides.length;
	}

	function goToSlide(index: number) {
		currentSlide = index;
	}

	function smoothScroll(e: MouseEvent, targetId: string) {
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
		autoplayInterval = setInterval(nextSlide, 5000);
		return () => {
			if (autoplayInterval) clearInterval(autoplayInterval);
		};
	});
</script>

<section id="home" class="relative h-screen overflow-hidden">
	{#each slides as slide, index}
		<div
			class="absolute inset-0 transition-opacity duration-1000"
			class:opacity-0={currentSlide !== index}
			class:opacity-100={currentSlide === index}
			style="background-image: url('{slide.image}'); background-size: cover; background-position: center;"
		>
			<div class="absolute inset-0 bg-black bg-opacity-40"></div>
			<div class="relative h-full flex items-center">
				<div class="container mx-auto px-4">
					<div class="max-w-2xl">
						<h3 class="text-white text-2xl mb-4 animate-fade-in">{slide.title}</h3>
						<h1 class="text-white text-5xl mb-8 animate-fade-in">{slide.subtitle}</h1>
						<a
							href={slide.ctaLink}
							on:click={(e) => smoothScroll(e, slide.ctaLink.slice(1))}
							class="inline-block bg-primary text-white px-8 py-3 rounded hover:bg-opacity-90 transition-colors animate-fade-in"
						>
							{slide.cta}
						</a>
					</div>
				</div>
			</div>
		</div>
	{/each}

	<!-- Slide indicators -->
	<div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
		{#each slides as _, index}
			<button
				on:click={() => goToSlide(index)}
				class="w-3 h-3 rounded-full transition-all {currentSlide === index ? 'bg-white' : 'bg-white/50'}"
				aria-label="Go to slide {index + 1}"
			></button>
		{/each}
	</div>
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

