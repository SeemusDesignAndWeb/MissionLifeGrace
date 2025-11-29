<script lang="js">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let title = 'Confirm';
	export let message = 'Are you sure?';
	export let confirmText = 'Yes';
	export let cancelText = 'No';
	export let confirmClass = 'bg-primary text-white hover:bg-primary-dark';
	export let cancelClass = 'bg-gray-300 text-gray-700 hover:bg-gray-400';

	const dispatch = createEventDispatcher();

	function handleConfirm() {
		dispatch('confirm');
		open = false;
	}

	function handleCancel() {
		dispatch('cancel');
		open = false;
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
		on:click={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="dialog-title"
	>
		<div
			class="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
			on:click|stopPropagation
		>
			<div class="p-6">
				<h3 id="dialog-title" class="text-xl font-bold text-gray-900 mb-4">
					{title}
				</h3>
				<p class="text-gray-700 mb-6">
					{message}
				</p>
				<div class="flex gap-3 justify-end">
					<button
						type="button"
						on:click={handleCancel}
						class="px-4 py-2 rounded-lg font-medium transition-colors {cancelClass}"
					>
						{cancelText}
					</button>
					<button
						type="button"
						on:click={handleConfirm}
						class="px-4 py-2 rounded-lg font-medium transition-colors {confirmClass}"
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

