import { getEvent, getContactInfo, getEventTicketTypes } from '$lib/server/database';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const event = getEvent(params.id);
	
	if (!event) {
		throw error(404, 'Event not found');
	}
	
	const contactInfo = getContactInfo();
	const ticketTypes = getEventTicketTypes(event.id);
	
	return { event, contactInfo, ticketTypes };
};

