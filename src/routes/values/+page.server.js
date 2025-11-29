import { getPage, getContactInfo } from '$lib/server/database';

export const load = async () => {
	const page = getPage('values');
	const contactInfo = getContactInfo();
	
	if (page) {
		return { page, contactInfo };
	}
	
	throw new Error('Values page not found');
};


