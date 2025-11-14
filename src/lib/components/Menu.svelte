<script lang="js">
	import { onMount } from 'svelte';

	export let services = [];

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	// Map database services to component format
	$: mappedServices = services.map(service => ({
		name: service.title || '',
		description: service.description || '',
		time: service.time || '',
		image: service.image || '',
		url: service.url || ''
	}));

	function handleServiceClick(service) {
		if (service.url) {
			window.open(service.url, service.url.startsWith('http') ? '_blank' : '_self');
		}
	}
</script>

<section id="services" class="py-20 bg-gray-900">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<span class="text-primary text-sm font-semibold uppercase tracking-wider mb-2 block">What We Offer</span>
			<h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
				Our Services & Programs
			</h2>
			<p class="text-xl text-gray-300 max-w-2xl mx-auto">
				Worship, Community & Growth
			</p>
		</div>

		<div class="grid md:grid-cols-3 gap-8">
			{#each mappedServices as service, index}
				{#if service.url}
					<div
						class="group relative animate-fade-in-up bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer hover:shadow-xl transform hover:-translate-y-2"
						style="animation-delay: {index * 0.1}s"
						on:click={() => handleServiceClick(service)}
						role="button"
						tabindex="0"
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleServiceClick(service);
							}
						}}
					>
						<div class="relative overflow-hidden aspect-[2/1]">
							<img
								src={service.image}
								alt={service.name}
								class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
							/>
							<div
								class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
							>
								<div class="text-white text-center">
									<i class="fa fa-external-link text-4xl"></i>
								</div>
							</div>
						</div>
						<div class="p-6">
							<h3 class="text-xl font-bold mb-2 text-white">{service.name}</h3>
							{#if service.time}
								<div class="text-primary font-bold text-sm mb-3">{service.time}</div>
							{/if}
							<div class="text-gray-300 text-sm leading-relaxed service-description">
								{@html service.description}
							</div>
						</div>
					</div>
				{:else}
					<div
						class="group relative animate-fade-in-up bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-lg transition-all duration-300"
						style="animation-delay: {index * 0.1}s"
					>
						<div class="relative overflow-hidden aspect-[2/1]">
							<img
								src={service.image}
								alt={service.name}
								class="w-full h-full object-cover"
							/>
						</div>
						<div class="p-6">
							<h3 class="text-xl font-bold mb-2 text-white">{service.name}</h3>
							{#if service.time}
								<div class="text-primary font-bold text-sm mb-3">{service.time}</div>
							{/if}
							<div class="text-gray-300 text-sm leading-relaxed service-description">
								{@html service.description}
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</section>


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

	/* Override inline styles in service descriptions to match dark theme */
	:global(.service-description),
	:global(.service-description *) {
		color: rgb(209, 213, 219) !important; /* text-gray-300 */
		background-color: transparent !important;
	}

	:global(.service-description p),
	:global(.service-description span) {
		color: rgb(209, 213, 219) !important;
		background-color: transparent !important;
	}
</style>

