import { getPage, getContactInfo, getActivities } from '$lib/server/database';

export const load = async () => {
	const page = getPage('activities');
	const contactInfo = getContactInfo();
	const activities = getActivities().sort((a, b) => (a.order || 0) - (b.order || 0));
	const heroSlides = page?.heroSlides || [];
	if (page) {
		return { page, contactInfo, activities, heroSlides };
	}
	const fallbackPage = {
		id: 'activities',
		title: 'Activities',
		heroTitle: 'Serving our community',
		heroImage: '/images/activities-bg.jpg',
		content: '',
		sections: [],
		published: true,
		heroSlides: []
	};
	return { page: fallbackPage, contactInfo, activities, heroSlides: [] };
};
