import { getConferenceBySlug, getConferenceTicketTypes, getContactInfo } from '$lib/server/database';
import { getSupportingPages } from '$lib/server/conference-helpers';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const conference = getConferenceBySlug(params.slug);
	
	if (!conference || !conference.published) {
		throw error(404, 'Conference not found');
	}
	
	if (!conference.supportingPages?.socialActivities) {
		throw error(404, 'Page not found');
	}
	
	const ticketTypes = getConferenceTicketTypes(conference.id);
	const contactInfo = getContactInfo();
	const supportingPages = getSupportingPages(conference);
	
	return { conference, ticketTypes, contactInfo, pageContent: conference.supportingPages.socialActivities, pageTitle: 'Social Activities', supportingPages };
};

