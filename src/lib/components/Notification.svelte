<script lang="js">
	import { onMount, createEventDispatcher } from 'svelte';

	export let notification;
	const dispatch = createEventDispatcher();

	let mounted = false;
	let closing = false;

	onMount(() => {
		mounted = true;
	});

	function close() {
		closing = true;
		setTimeout(() => {
			dispatch('close', notification.id);
		}, 300);
	}

	function getIcon(type) {
		switch (type) {
			case 'success':
				return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'error':
				return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'warning':
				return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
			case 'info':
			default:
				return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}

	function getColors(type) {
		switch (type) {
			case 'success':
				return {
					bg: 'bg-green-50',
					border: 'border-green-200',
					text: 'text-green-800',
					icon: 'text-green-400',
					button: 'text-green-500 hover:text-green-700'
				};
			case 'error':
				return {
					bg: 'bg-red-50',
					border: 'border-red-200',
					text: 'text-red-800',
					icon: 'text-red-400',
					button: 'text-red-500 hover:text-red-700'
				};
			case 'warning':
				return {
					bg: 'bg-yellow-50',
					border: 'border-yellow-200',
					text: 'text-yellow-800',
					icon: 'text-yellow-400',
					button: 'text-yellow-500 hover:text-yellow-700'
				};
			case 'info':
			default:
				return {
					bg: 'bg-blue-50',
					border: 'border-blue-200',
					text: 'text-blue-800',
					icon: 'text-blue-400',
					button: 'text-blue-500 hover:text-blue-700'
				};
		}
	}

	$: colors = getColors(notification.type);
	$: iconPath = getIcon(notification.type);
</script>

<div
	class="notification-item {colors.bg} {colors.border} border-l-4 rounded-lg shadow-lg p-4 mb-3 transform transition-all duration-300 ease-out {mounted && !closing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}"
	role="alert"
>
	<div class="flex items-start">
		<div class="flex-shrink-0">
			<svg class="h-5 w-5 {colors.icon}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
			</svg>
		</div>
		<div class="ml-3 flex-1">
			<p class="text-sm font-medium {colors.text}">{notification.message}</p>
		</div>
		<div class="ml-4 flex-shrink-0">
			<button
				type="button"
				class="inline-flex {colors.button} focus:outline-none transition-colors"
				on:click={close}
				aria-label="Close notification"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>
</div>

<style>
	.notification-item {
		min-width: 300px;
		max-width: 500px;
	}
</style>

