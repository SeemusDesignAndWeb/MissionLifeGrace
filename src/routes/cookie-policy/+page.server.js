import { getContactInfo, getPolicy } from '$lib/server/database';

export const load = async () => {
	const contactInfo = getContactInfo();
	const policy = getPolicy('cookiePolicy');
	return {
		contactInfo,
		policy
	};
};

