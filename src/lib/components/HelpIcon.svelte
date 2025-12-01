<script lang="js">
	import { onMount, onDestroy } from 'svelte';
	
	export let helpId = '';
	export let position = 'right'; // 'right', 'left', 'top', 'bottom'
	
	let showPopup = false;
	let popupElement;
	
	function togglePopup() {
		showPopup = !showPopup;
	}
	
	function closePopup() {
		showPopup = false;
	}
	
	// Close popup when clicking outside
	function handleClickOutside(event) {
		if (popupElement && !popupElement.contains(event.target) && !event.target.closest('.help-icon-button')) {
			closePopup();
		}
	}
	
	// Close on escape key
	function handleKeydown(event) {
		if (event.key === 'Escape' && showPopup) {
			closePopup();
		}
	}
	
	// Handle event listeners when popup is shown/hidden
	let listenersAdded = false;
	
	$: if (showPopup && typeof window !== 'undefined' && !listenersAdded) {
		window.addEventListener('click', handleClickOutside);
		window.addEventListener('keydown', handleKeydown);
		listenersAdded = true;
	} else if (!showPopup && typeof window !== 'undefined' && listenersAdded) {
		window.removeEventListener('click', handleClickOutside);
		window.removeEventListener('keydown', handleKeydown);
		listenersAdded = false;
	}
	
	// Cleanup on destroy
	onDestroy(() => {
		if (typeof window !== 'undefined' && listenersAdded) {
			window.removeEventListener('click', handleClickOutside);
			window.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<div class="help-icon-container inline-flex items-center relative ml-1">
	<button
		type="button"
		class="help-icon-button inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex-shrink-0"
		on:click={togglePopup}
		aria-label="Show help"
		aria-expanded={showPopup}
	>
		<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>
	</button>
	
	{#if showPopup}
		<div
			bind:this={popupElement}
			class="help-popup absolute z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 {position === 'right' ? 'left-6 top-0' : position === 'left' ? 'right-6 top-0' : position === 'top' ? 'left-0 bottom-6' : 'left-0 top-6'}"
			role="tooltip"
		>
			<div class="flex items-start justify-between mb-2">
				<h4 class="text-sm font-semibold text-gray-900">Help</h4>
				<button
					type="button"
					on:click={closePopup}
					class="text-gray-400 hover:text-gray-600 transition-colors"
					aria-label="Close help"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			<div class="text-sm text-gray-700">
				<slot />
			</div>
			<!-- Arrow pointing to icon -->
			<div class="absolute {position === 'right' ? '-left-2 top-3' : position === 'left' ? '-right-2 top-3' : position === 'top' ? 'left-3 -bottom-2' : 'left-3 -top-2'}">
				<div class="w-4 h-4 bg-white border-l border-b border-gray-200 transform rotate-45"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.help-popup {
		animation: fadeIn 0.2s ease-out;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

