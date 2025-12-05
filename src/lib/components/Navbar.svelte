<script lang="js">
	import { onMount } from 'svelte';

	export let bannerVisible = false;

	let menuOpen = false;
	let scrolled = false;
	let mounted = false;
	let navigationPages = [];

	// Page ID to route mapping
	const pageRoutes = {
		'im-new': '/im-new',
		'church': '/churches',
		'churches': '/churches',
		'values': '/values',
		'team': '/team',
		'community-groups': '/community-groups',
		'activities': '/activities',
		'audio': '/audio',
		'media': '/media',
		'conferences': '/conferences',
		'events': '/events'
	};

	// Get navigation label for a page
	function getNavigationLabel(page) {
		return page.navigationLabel || page.title || 'Page';
	}

	// Get route for a page or link
	function getPageRoute(item) {
		// If it's a link page, use the linkUrl
		if (item.isLink && item.linkUrl) {
			return item.linkUrl;
		}
		// Otherwise, use the page route mapping
		return pageRoutes[item.id] || `/${item.id}`;
	}
	
	// Get target for a link
	function getLinkTarget(item) {
		if (item.isLink && item.linkTarget) {
			return item.linkTarget;
		}
		return '_self';
	}
	
	// Handle link clicks - check if it's an anchor link
	function handleLinkClick(e, item) {
		const url = getPageRoute(item);
		// Check if it's an anchor link (starts with # or contains #)
		if (url.startsWith('#') || (url.includes('#') && !url.startsWith('http'))) {
			e.preventDefault();
			menuOpen = false;
			const hashIndex = url.indexOf('#');
			if (hashIndex >= 0) {
				const path = url.substring(0, hashIndex) || window.location.pathname;
				const anchor = url.substring(hashIndex + 1);
				// If we're on a different page, navigate first
				if (path !== window.location.pathname && path !== '') {
					window.location.href = url;
				} else {
					// Same page, just scroll
					smoothScroll(e, anchor);
				}
			}
		} else {
			menuOpen = false;
		}
	}

	onMount(async () => {
		// Load pages for navigation
		try {
			const response = await fetch('/api/navigation-pages');
			if (response.ok) {
				navigationPages = await response.json();
			}
		} catch (error) {
			console.error('Failed to load navigation pages:', error);
		}
	});

	onMount(() => {
		mounted = true;
		const handleScroll = () => {
			scrolled = window.scrollY > 50;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function smoothScroll(e, targetId) {
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
	class="fixed left-0 right-0 z-50 transition-all duration-300 {bannerVisible ? 'top-[45px]' : 'top-0'} {menuOpen ? 'bg-brand-blue shadow-md' : scrolled ? 'bg-white/90 backdrop-blur-sm shadow-md' : 'bg-white/70 backdrop-blur-sm'}"
>
	<div class="container mx-auto px-4">
		<div class="flex items-center justify-between transition-all duration-300" class:py-3={bannerVisible} class:py-4={!bannerVisible}>
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3">
				<img
					src="/images/mlg-logo.svg"
					alt="Mission Life Grace"
					class="h-12 w-auto transition-all duration-300 {menuOpen ? 'brightness-0 invert' : ''} {menuOpen ? 'md:brightness-0 md:invert' : 'md:brightness-100 md:invert-0'}"
				/>
				<span class="text-lg sm:text-xl md:text-2xl font-light transition-colors {menuOpen ? 'text-white' : 'text-gray-900'}">
					Mission Life Grace
				</span>
			</a>

			<!-- Mobile menu button -->
			<button
				class="md:hidden flex flex-col gap-1.5 p-2"
				on:click={() => (menuOpen = !menuOpen)}
				aria-label="Toggle menu"
			>
				<span
					class="block w-6 h-0.5 transition-all duration-300 {menuOpen ? 'bg-white' : 'bg-gray-900'}"
					class:rotate-45={menuOpen}
					class:translate-y-2={menuOpen}
				></span>
				<span
					class="block w-6 h-0.5 transition-all duration-300 {menuOpen ? 'bg-white' : 'bg-gray-900'}"
					class:opacity-0={menuOpen}
				></span>
				<span
					class="block w-6 h-0.5 transition-all duration-300 {menuOpen ? 'bg-white' : 'bg-gray-900'}"
					class:-rotate-45={menuOpen}
					class:-translate-y-2={menuOpen}
				></span>
			</button>

			<!-- Desktop menu -->
			<div class="hidden md:flex items-center gap-8">
				<ul class="flex items-center gap-6">
					{#each navigationPages as item}
						<li>
							<a
								href={getPageRoute(item)}
								target={getLinkTarget(item)}
								on:click={(e) => handleLinkClick(e, item)}
								class="transition-colors text-gray-900 hover:text-brand-blue"
							>
								{getNavigationLabel(item)}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if menuOpen}
			<div class="md:hidden pb-4 bg-brand-blue -mx-4 px-4 pt-4">
				<ul class="flex flex-col gap-4">
					{#each navigationPages as item}
						<li>
							<a
								href={getPageRoute(item)}
								target={getLinkTarget(item)}
								on:click={(e) => handleLinkClick(e, item)}
								class="block transition-colors text-white hover:text-gray-200"
							>
								{getNavigationLabel(item)}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</nav>

