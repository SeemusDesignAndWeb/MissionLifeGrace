import { getPage, getContactInfo } from '$lib/server/database';

export const load = async () => {
	const page = getPage('vision');
	const contactInfo = getContactInfo();
	
	if (page) {
		return { page, contactInfo };
	}
	
	throw new Error('Vision page not found');
};


