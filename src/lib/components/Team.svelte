<script>
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	const leadership = [
		{
			name: 'Pastor John Smith',
			role: 'Senior Pastor',
			image: '/images/team-image1.jpg',
			quote: 'Leading with love and serving our community with faith',
			social: [
				{ icon: 'fa-envelope-o', link: 'mailto:pastor@egcc.co.uk' },
				{ icon: 'fa-facebook-square', link: '#' }
			]
		},
		{
			name: 'Sarah Johnson',
			role: 'Worship Leader',
			image: '/images/team-image2.jpg',
			quote: 'Creating spaces for authentic worship and connection',
			social: [
				{ icon: 'fa-envelope-o', link: 'mailto:worship@egcc.co.uk' },
				{ icon: 'fa-instagram', link: '#' }
			]
		},
		{
			name: 'Michael Brown',
			role: 'Youth Pastor',
			image: '/images/team-image3.jpg',
			quote: 'Empowering the next generation to follow Christ',
			social: [
				{ icon: 'fa-envelope-o', link: 'mailto:youth@egcc.co.uk' },
				{ icon: 'fa-facebook-square', link: '#' }
			]
		}
	];
</script>

<section id="leadership" class="py-20 bg-gray-50">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<div class="section-title inline-block">
				<h2>Our Leadership Team</h2>
				<h4>Serving with heart & dedication</h4>
			</div>
		</div>

		<div class="grid md:grid-cols-3 gap-8">
			{#each leadership as leader, index}
				<div class="group relative animate-fade-in-up" style="animation-delay: {index * 0.2}s">
					<div class="relative overflow-hidden rounded-lg">
						<img
							src={leader.image}
							alt={leader.name}
							class="w-full h-auto transition-transform duration-500 group-hover:scale-110"
						/>
						<div
							class="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
						>
							<div class="text-center text-white p-6">
								<h4 class="text-xl mb-4">{leader.quote}</h4>
								<ul class="flex gap-4 justify-center">
									{#each leader.social as item}
										<li>
											<a
												href={item.link}
												class="text-white hover:text-primary text-2xl transition-colors"
											>
												<i class="fa {item.icon}"></i>
											</a>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
					<div class="mt-4 text-center">
						<h3 class="text-xl mb-1">{leader.name}</h3>
						<p class="text-light-gray">{leader.role}</p>
					</div>
				</div>
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
</style>

