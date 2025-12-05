import { json } from '@sveltejs/kit';
import { getChurches } from '$lib/server/database';

export const GET = async ({ url }) => {
	const type = url.searchParams.get('type');
	
	try {
		if (type === 'conference') {
			// Return churches that should show in conference dropdowns
			return json(getChurches({ conferenceOnly: true }));
		}
		// Default: return all churches visible on front-end
		return json(getChurches({ frontEndOnly: true }));
	} catch (error) {
		console.error('Failed to fetch churches:', error);
		return json({ error: 'Failed to fetch churches' }, { status: 500 });
	}
};

