import { getPage, getContactInfo, getCommunityGroups } from '$lib/server/database';

export const load = async () => {
	const page = getPage('community-groups');
	const contactInfo = getContactInfo();
	const communityGroups = getCommunityGroups();
	const heroSlides = page?.heroSlides || [];
	if (page) {
		return { page, contactInfo, communityGroups, heroSlides };
	}
	const fallbackPage = {
		id: 'community-groups',
		title: 'Community Groups',
		heroTitle: 'Community groups',
		heroImage: '/images/community-groups-bg.jpg',
		content: '',
		sections: [],
		published: true,
		heroSlides: []
	};
	return { page: fallbackPage, contactInfo, communityGroups, heroSlides: [] };
};
