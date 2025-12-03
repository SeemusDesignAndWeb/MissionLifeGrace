import { getPage, getContactInfo } from '$lib/server/database';

export const load = async () => {
	let page = getPage('values');
	const contactInfo = getContactInfo();
	
	// If page doesn't exist, return a default structure
	if (!page) {
		page = {
			id: 'values',
			title: 'Our Values',
			heroTitle: 'Our Values',
			heroSubtitle: 'The principles that guide us',
			heroImage: '',
			heroOverlay: 40,
			metaDescription: 'The values and principles that guide Mission Life Grace',
			content: '',
			published: true,
			sections: [{
				type: 'values',
				id: 'values-section',
				values: []
			}],
			heroSlides: []
		};
	}
	
	const heroSlides = page?.heroSlides || [];
	return { page, contactInfo, heroSlides };
};


