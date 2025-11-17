import { getPage, getSettings, getTeam, getContactInfo } from '$lib/server/database';

export async function load() {
	const page = getPage('team');
	const settings = getSettings();
	const team = getTeam();
	const contactInfo = getContactInfo();
	
	// Use page data if available, otherwise fall back to settings
	const teamHeroTitle = page?.heroTitle || settings.teamHeroTitle || 'Developing leaders of tomorrow';
	const teamHeroSubtitle = page?.heroSubtitle || settings.teamHeroSubtitle || '';
	const teamHeroButtons = page?.heroButtons || settings.teamHeroButtons || [];
	const teamHeroImage = page?.heroImage || settings.teamHeroImage || 'https://res.cloudinary.com/dl8kjhwjs/image/upload/v1763066390/egcc/egcc/img-church-bg.jpg';
	const teamDescription = settings.teamDescription || '';
	
	return {
		page: page || {
			id: 'team',
			title: 'Our Team',
			heroTitle: teamHeroTitle,
			heroSubtitle: teamHeroSubtitle,
			heroButtons: teamHeroButtons,
			heroImage: teamHeroImage,
			heroOverlay: 40,
			sections: []
		},
		teamDescription,
		teamHeroTitle,
		teamHeroSubtitle,
		teamHeroButtons,
		teamHeroImage,
		team: team || [],
		contactInfo
	};
}

