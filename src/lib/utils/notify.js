import { notifications } from '$lib/stores/notifications';

/**
 * Show a notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'warning', 'info' (default: 'info')
 * @param {number} duration - Duration in milliseconds (default: 5000, 0 = persistent)
 */
export function notify(message, type = 'info', duration = 5000) {
	return notifications.show(message, type, duration);
}

/**
 * Convenience functions for different notification types
 */
export const notifySuccess = (message, duration = 5000) => notify(message, 'success', duration);
export const notifyError = (message, duration = 5000) => notify(message, 'error', duration);
export const notifyWarning = (message, duration = 5000) => notify(message, 'warning', duration);
export const notifyInfo = (message, duration = 5000) => notify(message, 'info', duration);

