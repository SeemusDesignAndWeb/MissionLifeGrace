import { json } from '@sveltejs/kit';
import { getConferenceBySlug, getConferenceTicketTypes } from '$lib/server/database';

export const GET = async ({ params }) => {
	try {
		const conference = getConferenceBySlug(params.slug);
		
		if (!conference || !conference.published) {
			return json({ error: 'Conference not found' }, { status: 404 });
		}
		
		const ticketTypes = getConferenceTicketTypes(conference.id);
		
		return json({ conference, ticketTypes });
	} catch (error) {
		return json({ error: 'Failed to fetch conference' }, { status: 500 });
	}
};

