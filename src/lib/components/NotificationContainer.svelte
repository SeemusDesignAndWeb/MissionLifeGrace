<script lang="js">
	import { notifications } from '$lib/stores/notifications';
	import Notification from './Notification.svelte';

	function handleClose(event) {
		const id = event.detail;
		notifications.remove(id);
	}
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
	{#each $notifications as notification (notification.id)}
		<div class="pointer-events-auto">
			<Notification {notification} on:close={handleClose} />
		</div>
	{/each}
</div>

