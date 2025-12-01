/**
 * Help content for different pages and settings
 * This content is loaded from a central JSON file for easy management
 */

import helpContentData from './helpContent.json';

/**
 * Get help content by ID
 * @param {string} helpId - The ID of the help content to retrieve
 * @returns {object} Help content object with title and content
 */
export function getHelpContent(helpId) {
	return helpContentData[helpId] || {
		title: 'Help',
		content: '<p>Help content not available for this item.</p>'
	};
}

/**
 * Get all help content (for admin editing if needed)
 * @returns {object} All help content
 */
export function getAllHelpContent() {
	return helpContentData;
}
