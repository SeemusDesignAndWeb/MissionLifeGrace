import { getPage, getPodcasts, getContactInfo, getSettings } from '$lib/server/database';

export const load = async () => {
	const page = getPage('audio');
	const podcasts = getPodcasts();
	const contactInfo = getContactInfo();
	const settings = getSettings();
	const heroSlides = page?.heroSlides || [];
	return {
		page: page || {
			id: 'audio',
			title: 'Audio',
			heroTitle: 'Messages & Audio',
			heroImage: '/images/audio-bg.jpg',
			content: '',
			sections: [],
			heroSlides: []
		},
		podcasts,
		contactInfo,
		heroSlides,
		spotifyShowUrl: settings.spotifyShowUrl || 'https://open.spotify.com/show/7aczNe2FL8GCTxpaqM9WF1?si=9bab49974d2e48bc'
	};
};
