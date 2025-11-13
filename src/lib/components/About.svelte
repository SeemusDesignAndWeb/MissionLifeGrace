<script>
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<section id="about" class="py-20 bg-white">
	<div class="container mx-auto px-4">
		<div class="grid md:grid-cols-2 gap-12 items-center">
			<div class="animate-fade-in-up">
				<div class="section-title">
					<h4>Our Story</h4>
					<h2>Welcome to Eltham Green Community Church</h2>
				</div>

				<div class="space-y-4">
					<p>
						Eltham Green Community Church is a vibrant, welcoming church family located in the
						heart of Eltham, London. We are a community of believers committed to following
						Jesus Christ and sharing His love with our neighbors.
					</p>
					<p>
						Our mission is to build a community where everyone can experience God's love, grow
						in faith, and serve others. We believe in creating a space where people from all
						walks of life can come together to worship, learn, and support one another on their
						spiritual journey.
					</p>
					<p>
						Whether you're exploring faith for the first time or looking for a church home,
						we'd love to welcome you. Join us for worship, connect with our community, and
						discover how you can be part of what God is doing here in Eltham.
					</p>
				</div>
			</div>

			<div class="animate-fade-in-up" style="animation-delay: 0.2s">
				<img
					src="/images/about-image.jpg"
					alt="About us"
					class="w-full h-auto rounded-lg shadow-lg"
				/>
			</div>
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

