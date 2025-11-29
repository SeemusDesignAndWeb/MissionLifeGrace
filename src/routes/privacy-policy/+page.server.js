import { getContactInfo, getPolicy } from '$lib/server/database';

export const load = async () => {
	const contactInfo = getContactInfo();
	const policy = getPolicy('privacyPolicy');
	return {
		contactInfo,
		policy
	};
};

