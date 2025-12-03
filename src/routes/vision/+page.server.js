import { getPage, getContactInfo } from '$lib/server/database';

export const load = async () => {
	let page = getPage('vision');
	const contactInfo = getContactInfo();
	
	// If page doesn't exist, return a default structure
	if (!page) {
		page = {
			id: 'vision',
			title: 'Our Vision',
			heroTitle: 'Our Vision',
			heroSubtitle: 'What we believe and where we\'re going',
			heroImage: '',
			heroOverlay: 40,
			metaDescription: 'The vision of Mission Life Grace',
			content: '',
			published: true,
			sections: [],
			heroSlides: []
		};
	}
	
	const heroSlides = page?.heroSlides || [];
	return { page, contactInfo, heroSlides };
};


