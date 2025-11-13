<script>
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<div
	class="fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-1000"
	class:opacity-0={mounted}
	class:pointer-events-none={mounted}
>
	<div class="relative w-16 h-16">
		<div class="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
		<div
			class="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"
		></div>
	</div>
</div>

