import { getService, getContactInfo } from '$lib/server/database';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const service = getService(params.id);
	
	if (!service) {
		throw error(404, 'Service not found');
	}
	
	const contactInfo = getContactInfo();
	
	return { service, contactInfo };
};

