<script lang="js">
	import { onMount, onDestroy } from 'svelte';

	export let images = [];
	export let columns = 3; // Default to 3 columns
	export let gap = 'gap-4'; // Default gap
	export let title = '';
	export let startFullscreenSlideshow = false;
	export let slideshowInterval = 4000; // 4 seconds per image

	let fullscreenOpen = false;
	let currentImageIndex = 0;
	let slideshowTimer = null;
	let imageOpacity = 1;
	let slideshowPaused = false;

	function openFullscreen(index) {
		currentImageIndex = index;
		fullscreenOpen = true;
		document.body.style.overflow = 'hidden';
		// Hide event banner and navbar
		document.body.classList.add('gallery-fullscreen-active');
		imageOpacity = 1;
		slideshowPaused = false;
		// Start slideshow if enabled
		if (startFullscreenSlideshow) {
			startSlideshow();
		}
	}

	function closeFullscreen() {
		fullscreenOpen = false;
		document.body.style.overflow = '';
		// Show event banner and navbar again
		document.body.classList.remove('gallery-fullscreen-active');
		stopSlideshow();
		imageOpacity = 1;
		slideshowPaused = false;
	}

	function nextImage() {
		// Fade out
		imageOpacity = 0;
		setTimeout(() => {
			currentImageIndex = (currentImageIndex + 1) % images.length;
			// Fade in
			setTimeout(() => {
				imageOpacity = 1;
			}, 50);
		}, 300);
	}

	function prevImage() {
		// Fade out
		imageOpacity = 0;
		setTimeout(() => {
			currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
			// Fade in
			setTimeout(() => {
				imageOpacity = 1;
			}, 50);
		}, 300);
	}

	function startSlideshow() {
		if (slideshowTimer) {
			clearInterval(slideshowTimer);
		}
		if (images && images.length > 1 && !slideshowPaused) {
			slideshowTimer = setInterval(() => {
				nextImage();
			}, slideshowInterval);
		}
	}

	function stopSlideshow() {
		if (slideshowTimer) {
			clearInterval(slideshowTimer);
			slideshowTimer = null;
		}
	}

	function toggleSlideshow() {
		slideshowPaused = !slideshowPaused;
		if (slideshowPaused) {
			stopSlideshow();
		} else {
			startSlideshow();
		}
	}

	function handleKeydown(event) {
		if (!fullscreenOpen) return;
		
		if (event.key === 'Escape') {
			closeFullscreen();
		} else if (event.key === 'ArrowRight') {
			nextImage();
		} else if (event.key === 'ArrowLeft') {
			prevImage();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		
		// Auto-start fullscreen slideshow if enabled
		if (startFullscreenSlideshow && images && images.length > 0) {
			// Small delay to ensure page is loaded
			setTimeout(() => {
				openFullscreen(0);
			}, 500);
		}
		
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			stopSlideshow();
		};
	});

	onDestroy(() => {
		stopSlideshow();
	});

	$: gridCols = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
</script>

{#if images && images.length > 0}
	<div class="w-full">
		{#if !startFullscreenSlideshow}
			{#if title}
				<h2 class="text-4xl font-bold mb-8 text-center">{@html title}</h2>
			{/if}
			
			<div class="grid grid-cols-2 {gridCols} {gap}">
			{#each images as image, index}
				{@const imageUrl = typeof image === 'string' ? image : image.url || image.path || image}
				{@const imageAlt = typeof image === 'object' && image.alt ? image.alt : typeof image === 'object' && image.originalName ? image.originalName : `Gallery image ${index + 1}`}
				
				<div
					class="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-gray-100"
					on:click={() => openFullscreen(index)}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && openFullscreen(index)}
				>
					<img
						src={imageUrl}
						alt={imageAlt}
						class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
						loading="lazy"
					/>
					<div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
						<svg
							class="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
							/>
						</svg>
					</div>
				</div>
			{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Fullscreen Lightbox -->
{#if fullscreenOpen && images && images.length > 0}
	<div
		class="fixed bg-black"
		on:click={() => {
			// Only close on click if slideshow is not auto-started, or require double-click
			if (!startFullscreenSlideshow) {
				closeFullscreen();
			}
		}}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && closeFullscreen()}
		style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999; margin: 0; padding: 0; overflow: hidden;"
	>

		<!-- Pause/Play Button (only show when slideshow is active) -->
		{#if startFullscreenSlideshow && images.length > 1}
			<button
				on:click|stopPropagation={toggleSlideshow}
				class="absolute top-4 left-4 text-white hover:text-gray-300 z-10 p-2 bg-black bg-opacity-50 rounded-full"
				aria-label={slideshowPaused ? 'Play slideshow' : 'Pause slideshow'}
			>
				{#if slideshowPaused}
					<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z" />
					</svg>
				{:else}
					<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
					</svg>
				{/if}
			</button>
		{/if}

		<!-- Previous Button -->
		{#if images.length > 1}
			<button
				on:click|stopPropagation={prevImage}
				class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 bg-black bg-opacity-50 rounded-full"
				aria-label="Previous image"
			>
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
		{/if}

		<!-- Image Container -->
		<div
			class="absolute"
			on:click|stopPropagation
			style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden;"
		>
			{#if images && images.length > 0}
				{@const currentImage = images[currentImageIndex]}
				{@const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage.url || currentImage.path || currentImage}
				{@const imageAlt = typeof currentImage === 'object' && currentImage.alt ? currentImage.alt : typeof currentImage === 'object' && currentImage.originalName ? currentImage.originalName : `Gallery image ${currentImageIndex + 1}`}
				
				<img
					src={imageUrl}
					alt={imageAlt}
					class="w-full h-full object-cover transition-opacity duration-300"
					style="opacity: {imageOpacity};"
				/>
			{/if}
		</div>

		<!-- Next Button -->
		{#if images.length > 1}
			<button
				on:click|stopPropagation={nextImage}
				class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 bg-black bg-opacity-50 rounded-full"
				aria-label="Next image"
			>
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</button>
		{/if}

		<!-- Image Counter -->
		{#if images.length > 1}
			<div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded">
				{currentImageIndex + 1} / {images.length}
			</div>
		{/if}
	</div>
{/if}

<style>
	:global(body:has([style*="z-index: 99999"])) {
		overflow: hidden !important;
		margin: 0 !important;
		padding: 0 !important;
	}
	
	:global(html:has([style*="z-index: 99999"])) {
		margin: 0 !important;
		padding: 0 !important;
		overflow: hidden !important;
	}
	
	/* Hide event banner and navbar when gallery is fullscreen */
	:global(body.gallery-fullscreen-active [class*="z-[100]"]) {
		display: none !important;
		visibility: hidden !important;
		opacity: 0 !important;
		pointer-events: none !important;
	}
	
	:global(body.gallery-fullscreen-active nav) {
		display: none !important;
		visibility: hidden !important;
		opacity: 0 !important;
		pointer-events: none !important;
	}
	
	:global(body.gallery-fullscreen-active .gallery-hide-when-fullscreen) {
		display: none !important;
		visibility: hidden !important;
		opacity: 0 !important;
		pointer-events: none !important;
	}
	
	/* Ensure no spacing at top */
	:global(body.gallery-fullscreen-active > *) {
		margin-top: 0 !important;
	}
	
	/* Remove any default margins/padding from html and body */
	:global(body.gallery-fullscreen-active) {
		margin: 0 !important;
		padding: 0 !important;
		position: relative !important;
	}
</style>

