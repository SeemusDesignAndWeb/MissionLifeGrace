import { getConferenceBySlug, getConferenceTicketTypes, getContactInfo } from '$lib/server/database';
import { getSupportingPages } from '$lib/server/conference-helpers';
import { error } from '@sveltejs/kit';
import { isUserAuthenticated } from '$lib/server/user-auth';

export const load = async ({ params, cookies }) => {
	const conference = getConferenceBySlug(params.slug);
	
	if (!conference || !conference.published) {
		throw error(404, 'Conference not found');
	}
	
	if (!conference.supportingPages?.accommodation) {
		throw error(404, 'Page not found');
	}
	
	const ticketTypes = getConferenceTicketTypes(conference.id);
	const contactInfo = getContactInfo();
	const supportingPages = getSupportingPages(conference);
	const isAuthenticated = isUserAuthenticated(cookies);
	
	return { conference, ticketTypes, contactInfo, pageContent: conference.supportingPages.accommodation, pageTitle: 'Accommodation', supportingPages, isAuthenticated };
};

