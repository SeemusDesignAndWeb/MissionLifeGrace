import { getPage, getContactInfo } from '$lib/server/database';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
	const page = getPage('church');
	const contactInfo = getContactInfo();
	const heroSlides = page?.heroSlides || [];
	
	if (page) {
		return { page, contactInfo, heroSlides };
	}
	
	// If no church page exists, redirect to churches
	throw redirect(301, '/churches');
};
