import { getPage, getContactInfo, getEvents, getServices } from '$lib/server/database';

export const load = async () => {
	const page = getPage('events');
	const contactInfo = getContactInfo();
	const heroSlides = page?.heroSlides || [];
	// Get published events, sorted by date
	const allEvents = getEvents();
	const events = allEvents
		.filter(e => e.published)
		.sort((a, b) => {
			const dateA = new Date(a.date || '9999-12-31');
			const dateB = new Date(b.date || '9999-12-31');
			return dateA.getTime() - dateB.getTime();
		});
	// Get services (training & networking events), sorted by order
	const services = getServices().sort((a, b) => (a.order || 0) - (b.order || 0));
	if (page) {
		return { page, contactInfo, events, services, heroSlides };
	}
	const fallbackPage = {
		id: 'events',
		title: 'Events',
		heroTitle: 'Events',
		heroImage: '/images/activities-bg.jpg',
		content: '',
		sections: [],
		published: true,
		heroSlides: []
	};
	return { page: fallbackPage, contactInfo, events, services, heroSlides: [] };
};

