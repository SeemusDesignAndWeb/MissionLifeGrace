<script lang="ts">
	import { onMount } from 'svelte';

	let menuOpen = false;
	let scrolled = false;
	let mounted = false;

	onMount(() => {
		mounted = true;
		const handleScroll = () => {
			scrolled = window.scrollY > 50;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function smoothScroll(e: MouseEvent, targetId: string) {
		e.preventDefault();
		menuOpen = false;
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
</script>

<nav
	class="fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300"
	class:shadow-md={scrolled}
>
	<div class="container mx-auto px-4">
		<div class="flex items-center justify-between py-4">
			<!-- Logo -->
			<a href="/" class="text-2xl font-bold text-dark-gray">
				Eltham Green <span class="text-primary">Community Church</span>
			</a>

			<!-- Mobile menu button -->
			<button
				class="md:hidden flex flex-col gap-1.5 p-2"
				on:click={() => (menuOpen = !menuOpen)}
				aria-label="Toggle menu"
			>
				<span
					class="block w-6 h-0.5 bg-dark-gray transition-all duration-300"
					class:rotate-45={menuOpen}
					class:translate-y-2={menuOpen}
				></span>
				<span
					class="block w-6 h-0.5 bg-dark-gray transition-all duration-300"
					class:opacity-0={menuOpen}
				></span>
				<span
					class="block w-6 h-0.5 bg-dark-gray transition-all duration-300"
					class:-rotate-45={menuOpen}
					class:-translate-y-2={menuOpen}
				></span>
			</button>

			<!-- Desktop menu -->
			<div class="hidden md:flex items-center gap-8">
				<ul class="flex items-center gap-6">
					<li>
						<a
							href="#home"
							on:click={(e) => smoothScroll(e, 'home')}
							class="hover:text-primary transition-colors"
						>
							Home
						</a>
					</li>
					<li>
						<a
							href="#about"
							on:click={(e) => smoothScroll(e, 'about')}
							class="hover:text-primary transition-colors"
						>
							About
						</a>
					</li>
					<li>
						<a
							href="#leadership"
							on:click={(e) => smoothScroll(e, 'leadership')}
							class="hover:text-primary transition-colors"
						>
							Leadership
						</a>
					</li>
					<li>
						<a
							href="#services"
							on:click={(e) => smoothScroll(e, 'services')}
							class="hover:text-primary transition-colors"
						>
							Services
						</a>
					</li>
					<li>
						<a
							href="#contact"
							on:click={(e) => smoothScroll(e, 'contact')}
							class="hover:text-primary transition-colors"
						>
							Contact
						</a>
					</li>
				</ul>

				<div class="flex items-center gap-4 ml-6">
					<a href="tel:02088503030" class="hover:text-primary transition-colors">
						<i class="fa fa-phone"></i> 020 8850 3030
					</a>
					<a
						href="#contact"
						on:click={(e) => smoothScroll(e, 'contact')}
						class="bg-primary text-white px-6 py-2 rounded hover:bg-opacity-90 transition-colors"
					>
						Get in Touch
					</a>
				</div>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if menuOpen}
			<div class="md:hidden pb-4">
				<ul class="flex flex-col gap-4">
					<li>
						<a
							href="#home"
							on:click={(e) => smoothScroll(e, 'home')}
							class="block hover:text-primary transition-colors"
						>
							Home
						</a>
					</li>
					<li>
						<a
							href="#about"
							on:click={(e) => smoothScroll(e, 'about')}
							class="block hover:text-primary transition-colors"
						>
							About
						</a>
					</li>
					<li>
						<a
							href="#leadership"
							on:click={(e) => smoothScroll(e, 'leadership')}
							class="block hover:text-primary transition-colors"
						>
							Leadership
						</a>
					</li>
					<li>
						<a
							href="#services"
							on:click={(e) => smoothScroll(e, 'services')}
							class="block hover:text-primary transition-colors"
						>
							Services
						</a>
					</li>
					<li>
						<a
							href="#contact"
							on:click={(e) => smoothScroll(e, 'contact')}
							class="block hover:text-primary transition-colors"
						>
							Contact
						</a>
					</li>
					<li>
						<a href="tel:02088503030" class="block hover:text-primary transition-colors">
							<i class="fa fa-phone"></i> 020 8850 3030
						</a>
					</li>
					<li>
						<a
							href="#contact"
							on:click={(e) => smoothScroll(e, 'contact')}
							class="block bg-primary text-white px-6 py-2 rounded text-center hover:bg-opacity-90 transition-colors"
						>
							Get in Touch
						</a>
					</li>
				</ul>
			</div>
		{/if}
	</div>
</nav>

