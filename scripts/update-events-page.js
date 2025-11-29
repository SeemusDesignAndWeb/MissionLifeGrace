import { readDatabase, writeDatabase, getPage, savePage } from '../src/lib/server/database.js';

function updateEventsPage() {
	const db = readDatabase();
	
	// Get existing events page or create new one
	let eventsPage = getPage('events');
	
	if (!eventsPage) {
		// Create new events page matching front-end structure
		eventsPage = {
			id: 'events',
			title: 'Events',
			metaDescription: 'Join us for training, networking, and community events',
			heroTitle: 'Events',
			heroSubtitle: 'Join us for training, networking, and community events',
			heroImage: '',
			heroOverlay: 40,
			heroButtons: [],
			content: '',
			eventsSectionLabel: "What's Happening",
			eventsSectionTitle: 'Events & Activities',
			eventsSectionDescription: 'Join us for training, networking, and community events',
			sections: [
				{
					id: 'intro-section',
					type: 'text',
					content: 'Join us for training, networking, and community events'
				}
			],
			published: true,
			showInNavigation: true,
			navigationLabel: 'Events',
			navigationOrder: 3
		};
	} else {
		// Update existing page with front-end content
		// Update existing page with front-end content structure
		eventsPage = {
			...eventsPage,
			title: 'Events',
			metaDescription: 'Join us for training, networking, and community events',
			heroTitle: 'Events',
			heroSubtitle: 'Join us for training, networking, and community events',
			heroImage: eventsPage.heroImage || '',
			heroOverlay: eventsPage.heroOverlay || 40,
			heroButtons: eventsPage.heroButtons || [],
			content: eventsPage.content || '',
			eventsSectionLabel: eventsPage.eventsSectionLabel || "What's Happening",
			eventsSectionTitle: eventsPage.eventsSectionTitle || 'Events & Activities',
			eventsSectionDescription: eventsPage.eventsSectionDescription || 'Join us for training, networking, and community events',
			sections: [
				{
					id: 'intro-section',
					type: 'text',
					content: 'Join us for training, networking, and community events'
				}
			],
			published: true,
			showInNavigation: true,
			navigationLabel: 'Events',
			navigationOrder: 3
		};
	}
	
	// Save the page
	savePage(eventsPage);
	
	console.log('✓ Events page updated successfully');
	console.log('  - Title:', eventsPage.title);
	console.log('  - Hero Title:', eventsPage.heroTitle);
	console.log('  - Hero Subtitle:', eventsPage.heroSubtitle);
	console.log('  - Published:', eventsPage.published);
	console.log('  - Show in Navigation:', eventsPage.showInNavigation);
}

updateEventsPage();

