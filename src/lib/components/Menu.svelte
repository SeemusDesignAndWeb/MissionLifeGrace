<script lang="ts">
	import { onMount } from 'svelte';

	let mounted = false;
	let lightboxImage: string | null = null;

	onMount(() => {
		mounted = true;
	});

	const services = [
		{
			name: 'Sunday Worship',
			description: 'Join us every Sunday at 10:30 AM for inspiring worship and teaching',
			time: '10:30 AM',
			image: '/images/menu-image1.jpg'
		},
		{
			name: 'Youth Group',
			description: 'Fridays at 7 PM - A place for teens to connect, grow, and have fun',
			time: 'Friday 7:00 PM',
			image: '/images/menu-image2.jpg'
		},
		{
			name: 'Bible Study',
			description: 'Wednesday evenings - Deep dive into God\'s Word together',
			time: 'Wednesday 7:30 PM',
			image: '/images/menu-image3.jpg'
		},
		{
			name: 'Prayer Meeting',
			description: 'Join us for prayer and fellowship every Tuesday evening',
			time: 'Tuesday 7:00 PM',
			image: '/images/menu-image4.jpg'
		},
		{
			name: 'Children\'s Ministry',
			description: 'Sunday School and activities for kids during the service',
			time: 'Sunday 10:30 AM',
			image: '/images/menu-image5.jpg'
		},
		{
			name: 'Community Outreach',
			description: 'Serving our local community through various programs and events',
			time: 'Various Times',
			image: '/images/menu-image6.jpg'
		}
	];

	function openLightbox(image: string) {
		lightboxImage = image;
	}

	function closeLightbox() {
		lightboxImage = null;
	}
</script>

<section id="services" class="py-20 bg-white">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<div class="section-title inline-block">
				<h2>Our Services & Programs</h2>
				<h4>Worship, Community & Growth</h4>
			</div>
		</div>

		<div class="grid md:grid-cols-3 gap-8">
			{#each services as service, index}
				<div
					class="group relative cursor-pointer animate-fade-in-up"
					style="animation-delay: {index * 0.1}s"
					on:click={() => openLightbox(service.image)}
					role="button"
					tabindex="0"
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							openLightbox(service.image);
						}
					}}
				>
					<div class="relative overflow-hidden rounded-lg">
						<img
							src={service.image}
							alt={service.name}
							class="w-full h-auto transition-transform duration-500 group-hover:scale-110"
						/>
						<div
							class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
						>
							<div class="text-white text-center">
								<i class="fa fa-info-circle text-4xl"></i>
							</div>
						</div>
					</div>
					<div class="mt-4">
						<div class="flex justify-between items-start mb-2">
							<h3 class="text-xl mb-1">{service.name}</h3>
							<div class="text-primary font-bold text-sm whitespace-nowrap ml-4">{service.time}</div>
						</div>
						<p class="text-light-gray text-sm">{service.description}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Lightbox -->
{#if lightboxImage}
	<div
		class="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
		on:click={closeLightbox}
		on:keydown={(e) => {
			if (e.key === 'Escape') closeLightbox();
		}}
		role="button"
		tabindex="0"
	>
		<button
			class="absolute top-4 right-4 text-white text-4xl hover:text-primary transition-colors"
			on:click={closeLightbox}
			aria-label="Close lightbox"
		>
			&times;
		</button>
		<img
			src={lightboxImage}
			alt="Service"
			class="max-w-full max-h-full object-contain"
			on:click|stopPropagation
		/>
	</div>
{/if}

<style>
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

