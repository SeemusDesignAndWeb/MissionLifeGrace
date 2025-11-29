import { getConferenceBySlug, getConferenceTicketTypes, getContactInfo } from '$lib/server/database';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const conference = getConferenceBySlug(params.slug);
	
	if (!conference || !conference.published) {
		throw error(404, 'Conference not found');
	}
	
	const ticketTypes = getConferenceTicketTypes(conference.id);
	const contactInfo = getContactInfo();
	
	return { conference, ticketTypes, contactInfo };
};

