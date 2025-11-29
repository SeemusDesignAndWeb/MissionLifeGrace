import { getEvent, getContactInfo } from '$lib/server/database';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const event = getEvent(params.id);
	
	if (!event) {
		throw error(404, 'Event not found');
	}
	
	const contactInfo = getContactInfo();
	
	return { event, contactInfo };
};

