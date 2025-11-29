import { getPage, getContactInfo, getConferences } from '$lib/server/database';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
	const page = getPage('conferences');
	const contactInfo = getContactInfo();
	// Get published conferences, sorted by start date
	const allConferences = getConferences();
	const conferences = allConferences
		.filter(c => c.published && c.registrationOpen)
		.sort((a, b) => {
			const dateA = new Date(a.startDate || '9999-12-31');
			const dateB = new Date(b.startDate || '9999-12-31');
			return dateA.getTime() - dateB.getTime();
		});
	
	// If only one conference is available, redirect directly to it
	if (conferences.length === 1 && conferences[0].slug) {
		throw redirect(302, `/conference/${conferences[0].slug}`);
	}
	
	if (page) {
		return { page, contactInfo, conferences };
	}
	
	const fallbackPage = {
		id: 'conferences',
		title: 'Conferences',
		heroTitle: 'Conferences',
		heroImage: '/images/activities-bg.jpg',
		content: '',
		sections: [],
		published: true
	};
	return { page: fallbackPage, contactInfo, conferences };
};

