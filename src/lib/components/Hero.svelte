<script lang="js">
	import { onMount, getContext } from 'svelte';

	export let heroSlides = null;
	export let featuredEvents = null;

	let currentSlide = 0;
	let autoplayInterval = null;
	let bannerVisible = false;
	let circlesVisible = false;
	let scrollY = 0;
	
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

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	function formatTime(timeString) {
		if (!timeString) return '';
		// Convert 24h to 12h format if needed
		const [hours, minutes] = timeString.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
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
		},
		{
			id: 'default-2',
			title: 'A Network of Churches',
			subtitle: 'Working together to see the Kingdom of God come',
			cta: 'Our Churches',
			ctaLink: '/churches',
			image: 'https://res.cloudinary.com/dsnceqtza/image/upload/v1763390998/mission-life-grace/375d5fb3-6856-49be-a8d1-48859a442bca.jpg'
		},
		{
			id: 'default-3',
			title: 'Training & Networking',
			subtitle: 'Equipping leaders and building community across the network',
			cta: 'Get involved',
			ctaLink: '#services',
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
		autoplayInterval = window.setInterval(nextSlide, 5000);
		
		// Animate circles on load
		setTimeout(() => {
			circlesVisible = true;
		}, 300);
		
		// Animate circles on scroll
		const handleScroll = () => {
			scrollY = window.scrollY;
			if (scrollY > 50 && !circlesVisible) {
				circlesVisible = true;
			}
		};
		
		window.addEventListener('scroll', handleScroll);
		
		return () => {
			if (autoplayInterval) window.clearInterval(autoplayInterval);
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<section id="home" class="relative h-[calc(60vh+20px)] md:h-[calc(100vh-80px+20px)] overflow-hidden transition-all duration-300" class:mt-[5px]={bannerVisible}>
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
				<div class="grid md:grid-cols-3 gap-4 md:gap-8 w-full">
					<!-- Left side - Hero content -->
					<div class="md:col-span-2 col-span-full">
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
									on:click={(e) => smoothScroll(e, slide.ctaLink.slice(1))}
									class="inline-block bg-primary text-white px-6 py-2 md:px-8 md:py-4 rounded-full text-sm md:text-base font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg animate-fade-in"
								>
									{slide.cta}
								</a>
							{/if}
						</div>
					</div>
					<!-- Right side - Events (Desktop) -->
					{#if featuredEvents && featuredEvents.length > 0}
						<div class="md:col-span-1 hidden md:block">
							<div class="space-y-3 md:space-y-4 animate-fade-in">
								{#each featuredEvents as event}
									<a
										href="/events/{event.id}"
										class="block transition-all transform hover:scale-105 cursor-pointer group"
									>
										<div class="relative flex justify-center">
											<!-- Decorative circles around the event image - animated -->
											<div class="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-primary/50 rounded-full blur-sm transition-all duration-1000 {circlesVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} {circlesVisible ? 'animate-float' : ''}" style="animation-delay: 0.1s"></div>
											<div class="absolute -bottom-2 -left-2 md:-bottom-4 md:-left-4 w-12 h-12 md:w-20 md:h-20 lg:w-28 lg:h-28 bg-brand-blue/50 rounded-full blur-sm transition-all duration-1000 {circlesVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} {circlesVisible ? 'animate-float' : ''}" style="animation-delay: 0.3s"></div>
											<div class="absolute top-1/2 -right-8 md:-right-12 lg:-right-16 w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-primary-light/60 rounded-full blur-[2px] transition-all duration-1000 {circlesVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} {circlesVisible ? 'animate-float' : ''}" style="animation-delay: 0.5s"></div>
											<div class="absolute top-1/4 -left-8 md:-left-12 lg:-left-16 w-14 h-14 md:w-18 md:h-18 lg:w-24 lg:h-24 bg-brand-blue/45 rounded-full blur-[2px] transition-all duration-1000 {circlesVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} {circlesVisible ? 'animate-float' : ''}" style="animation-delay: 0.7s"></div>
											<div class="absolute bottom-1/4 right-1/4 w-8 h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-primary/55 rounded-full transition-all duration-1000 {circlesVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} {circlesVisible ? 'animate-float' : ''}" style="animation-delay: 0.2s"></div>
											<div class="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-brand-blue/50 rounded-full transition-all duration-1000 {circlesVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} {circlesVisible ? 'animate-float' : ''}" style="animation-delay: 0.4s"></div>
											<div class="absolute bottom-0 right-1/3 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-primary/45 rounded-full blur-[1px] transition-all duration-1000 {circlesVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} {circlesVisible ? 'animate-float' : ''}" style="animation-delay: 0.6s"></div>
											
											{#if event.image}
												<img
													src={event.image}
													alt={event.title || 'Event'}
													class="relative z-10 w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full object-cover shadow-2xl"
												/>
											{:else}
												<div class="relative z-10 w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-primary via-brand-blue to-primary-dark shadow-2xl"></div>
											{/if}
										</div>
									</a>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
		</div>
	{/each}

	<!-- Slide indicators -->
	<div class="hidden md:flex absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 gap-2 z-10">
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

	@keyframes glow-pulse {
		0%, 100% {
			box-shadow: 0 0 40px rgba(75, 177, 112, 0.5), 0 0 80px rgba(75, 177, 112, 0.3), 0 0 120px rgba(75, 177, 112, 0.2), 0 0 160px rgba(75, 177, 112, 0.1);
		}
		50% {
			box-shadow: 0 0 60px rgba(75, 177, 112, 0.7), 0 0 120px rgba(75, 177, 112, 0.5), 0 0 180px rgba(75, 177, 112, 0.3), 0 0 240px rgba(75, 177, 112, 0.15);
		}
	}

	@keyframes glow-background {
		0%, 100% {
			opacity: 0.5;
			filter: blur(16px);
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			filter: blur(24px);
			transform: scale(1.05);
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-10px) scale(1.05);
		}
	}

	.animate-float {
		animation: float 3s ease-in-out infinite;
	}

</style>

