import { writable } from 'svelte/store';

function createNotificationStore() {
	const { subscribe, set, update } = writable([]);

	return {
		subscribe,
		/**
		 * Show a notification
		 * @param {string} message - The message to display
		 * @param {string} type - 'success', 'error', 'warning', 'info'
		 * @param {number} duration - Duration in milliseconds (default: 5000)
		 */
		show: (message, type = 'info', duration = 5000) => {
			const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
			const notification = {
				id,
				message,
				type,
				duration
			};

			update((notifications) => [...notifications, notification]);

			// Auto-remove after duration
			if (duration > 0) {
				setTimeout(() => {
					update((notifications) => notifications.filter((n) => n.id !== id));
				}, duration);
			}

			return id;
		},
		/**
		 * Remove a notification by ID
		 */
		remove: (id) => {
			update((notifications) => notifications.filter((n) => n.id !== id));
		},
		/**
		 * Clear all notifications
		 */
		clear: () => {
			set([]);
		}
	};
}

export const notifications = createNotificationStore();

