import { json } from '@sveltejs/kit';
import { getPages } from '$lib/server/database';

export const GET = async () => {
	try {
		const allPages = getPages();
		
		// Filter pages that should be shown in navigation (exclude vision as it's now on front page)
		const navigationPages = allPages
			.filter(page => page.showInNavigation !== false && page.id !== 'vision')
			.map(page => ({
				...page,
				type: page.isLink ? 'link' : 'page'
			}));
		
		// Sort by navigationOrder
		navigationPages.sort((a, b) => {
			const orderA = a.navigationOrder !== undefined ? a.navigationOrder : 999;
			const orderB = b.navigationOrder !== undefined ? b.navigationOrder : 999;
			if (orderA !== orderB) {
				return orderA - orderB;
			}
			return (a.navigationLabel || a.title || '').localeCompare(b.navigationLabel || b.title || '');
		});
		
		return json(navigationPages);
	} catch (error) {
		console.error('Failed to fetch navigation pages:', error);
		return json({ error: 'Failed to fetch navigation pages' }, { status: 500 });
	}
};

