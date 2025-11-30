import { getConferenceBySlug, getConferenceTicketTypes, getContactInfo } from '$lib/server/database';
import { error } from '@sveltejs/kit';
import { isUserAuthenticated } from '$lib/server/user-auth';

export const load = async ({ params, cookies }) => {
	const conference = getConferenceBySlug(params.slug);
	
	if (!conference || !conference.published) {
		throw error(404, 'Conference not found');
	}
	
	const ticketTypes = getConferenceTicketTypes(conference.id);
	const contactInfo = getContactInfo();
	const isAuthenticated = isUserAuthenticated(cookies);
	
	return { conference, ticketTypes, contactInfo, isAuthenticated };
};

