import { getPage, getContactInfo } from '$lib/server/database';

export const load = async () => {
	const page = getPage('churches');
	const contactInfo = getContactInfo();
	const heroSlides = page?.heroSlides || [];
	
	// Filter churches to only show those with showOnFrontEnd = true and hideFromAll = false
	if (page && page.sections) {
		page.sections = page.sections.map(section => {
			if (section.id === 'churches-grid' && section.columns) {
				const beforeCount = section.columns.length;
				section.columns = section.columns.filter(church => {
					const showOnFrontEnd = church.showOnFrontEnd !== undefined ? church.showOnFrontEnd : true;
					const hideFromAll = church.hideFromAll !== undefined ? church.hideFromAll : false;
					return showOnFrontEnd && !hideFromAll;
				});
				const afterCount = section.columns.length;
				console.log(`[Churches Page] Filtered churches: ${beforeCount} total, ${afterCount} visible on front-end`);
				if (afterCount > 0) {
					console.log(`[Churches Page] Visible churches:`, section.columns.map(c => c.title).join(', '));
				}
			}
			return section;
		});
	}
	
	// Debug logging
	if (page) {
		console.log('[Churches Page] Loaded page from database:', {
			id: page.id,
			title: page.title,
			hasSections: !!page.sections,
			sectionsCount: page.sections?.length || 0,
			sectionsTypes: page.sections?.map(s => s.type) || []
		});
		return { page, contactInfo, heroSlides };
	}
	
	console.warn('[Churches Page] Page not found in database, using fallback');
	const fallbackPage = {
		id: 'churches',
		title: 'The Churches',
		heroTitle: 'The Churches',
		heroImage: '/images/church-bg.jpg',
		content: '',
		sections: [],
		published: true,
		heroSlides: []
	};
	return { page: fallbackPage, contactInfo, heroSlides: [] };
};

