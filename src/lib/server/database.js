import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// Environment variable configuration
const DB_PATH = process.env.DATABASE_PATH || './data/database.json';

// Path resolution function
function getDbPath() {
	let finalPath;
	if (DB_PATH.startsWith('./') || DB_PATH.startsWith('../')) {
		// Relative path - resolve from project root (local development)
		finalPath = join(process.cwd(), DB_PATH);
	} else {
		// Absolute path (e.g., /data/database.json for Railway volumes)
		finalPath = DB_PATH;
	}

	// Ensure the directory exists
	const dir = dirname(finalPath);
	try {
		mkdirSync(dir, { recursive: true });
	} catch (error) {
		// Directory might already exist, or volume might not be mounted yet (during build)
		console.warn('[DB] Could not create directory:', error);
	}

	return finalPath;
}

// Default database structure
const defaultDatabase = {
	pages: [],
	navigationLinks: [],
	team: [],
	services: [],
	heroSlides: [],
	images: [],
	podcasts: [],
	communityGroups: [],
	events: [],
	conferences: [],
	conferenceTicketTypes: [],
	conferenceBookings: [],
	conferenceAttendees: [],
	conferenceDiscountCodes: [],
	conferencePaymentSchedules: [],
	conferenceFormFields: [],
	contact: {
		address: '542 Westhorne Avenue, Eltham, London, SE9 6RR',
		email: 'enquiries@egcc.co.uk',
		googleMapsUrl:
			'https://www.google.com/maps/place/Eltham+Green+Community+Church/@51.4551128,0.0400237,15z'
	},
	serviceTimes: {
		sunday: '11:00 AM (Doors open at 10:30 AM)',
		weekday: 'Various times - see Community Groups',
		notes: ''
	},
	settings: {
		siteName: 'Eltham Green Community Church',
		primaryColor: '#0693ad',
		podcastAuthor: 'Eltham Green Community Church',
		podcastEmail: 'johnawatson72@gmail.com',
		podcastImage: 'http://www.egcc.co.uk/company/egcc/images/EGCC-Audio.png',
		podcastDescription: 'Latest messages and teachings from Mission Life Grace',
		teamDescription: 'MLG is led by a Leadership Team. The team works together to provide direction and support for the network.&nbsp; We take responsibility together for the life and care of the network.&nbsp; The Leadership Team is supported by many others who take a leadership role whether that be in training, networking events, community work, youth and children\'s work and other network and community activities.',
		teamHeroTitle: 'Developing leaders of tomorrow',
		teamHeroImage: 'https://res.cloudinary.com/dsnceqtza/image/upload/v1763390998/mission-life-grace/375d5fb3-6856-49be-a8d1-48859a442bca.jpg',
		youtubePlaylistId: '',
		youtubeChannelId: '',
		spotifyShowUrl: 'https://open.spotify.com/show/7aczNe2FL8GCTxpaqM9WF1?si=9bab49974d2e48bc'
	},
	home: {
		aboutLabel: 'Our Story',
		aboutTitle: 'Welcome to Eltham Green Community Church',
		aboutContent: '<p>Eltham Green Community Church is a vibrant, welcoming church family located in the heart of Eltham, London. We are a community of believers committed to following Jesus Christ and sharing His love with our neighbors.</p><p>Our mission is to build a community where everyone can experience God\'s love, grow in faith, and serve others. We believe in creating a space where people from all walks of life can come together to worship, learn, and support one another on their spiritual journey.</p><p>Whether you\'re exploring faith for the first time or looking for a church home, we\'d love to welcome you. Join us for worship, connect with our community, and discover how you can be part of what God is doing here in Eltham.</p>',
		aboutImage: 'https://res.cloudinary.com/dsnceqtza/image/upload/v1763390998/mission-life-grace/375d5fb3-6856-49be-a8d1-48859a442bca.jpg',
		visionLabel: 'Our Vision',
		visionTitle: 'We Believe',
		visionText: 'We believe every church exists to be part of God\'s mission to show the world Christ and that we are better equipped to do this in partnership with other churches. As a network our focus is to encourage each other through sharing our hearts, ideas and lessons learned along the way, to challenge one another to stay true to the course and to invest in helping people fulfil their God given calling. We believe that by journeying together we can see God do great things in our nation and around the world.'
	},
	policies: {
		privacyPolicy: {
			title: 'Privacy Policy',
			content: '<p>This is the privacy policy content. Edit this in the admin area.</p>',
			lastUpdated: new Date().toISOString()
		},
		termsAndConditions: {
			title: 'Terms and Conditions',
			content: '<p>This is the terms and conditions content. Edit this in the admin area.</p>',
			lastUpdated: new Date().toISOString()
		},
		cookiePolicy: {
			title: 'Cookie Policy',
			content: '<p>This is the cookie policy content. Edit this in the admin area.</p>',
			lastUpdated: new Date().toISOString()
		}
	}
};

// Read function - Auto-initializes in development only
export function readDatabase() {
	const dbPath = getDbPath();
	try {
		const data = readFileSync(dbPath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		const isProduction = process.env.NODE_ENV === 'production' || dbPath.startsWith('/');
		
		if (isProduction) {
			// In production, database must exist on the volume
			console.error('[DB] CRITICAL: Failed to read database in production:', error.message);
			console.error('[DB] Database file path:', dbPath);
			throw new Error(`Database file not found at ${dbPath}. Please ensure the Railway volume is mounted and the database file exists.`);
		}
		
		// Only auto-initialize in development
		console.warn('[DB] Database file does not exist (development mode), initializing with default structure...');
		
		try {
			writeDatabase(defaultDatabase);
			console.log('[DB] Successfully initialized database with default structure');
		} catch (writeError) {
			console.warn('[DB] Could not write to persistent location:', writeError);
			console.log('[DB] Returning default structure in memory (changes will not persist)');
		}

		return defaultDatabase;
	}
}

// Write function
export function writeDatabase(data) {
	const dbPath = getDbPath();
	const dir = dirname(dbPath);

	try {
		mkdirSync(dir, { recursive: true });
	} catch (error) {
		// Directory might already exist, ignore
		console.warn('[DB] Directory creation warning:', error);
	}

	try {
		const jsonData = JSON.stringify(data, null, 2);
		writeFileSync(dbPath, jsonData, 'utf-8');
		console.log('[DB] Successfully wrote database to', dbPath);
	} catch (error) {
		console.error('[DB] Could not write database:', error);
		throw error;
	}
}

// CRUD operations for Pages
export function getPages() {
	const db = readDatabase();
	return db.pages || [];
}

export function getPage(id) {
	const db = readDatabase();
	return db.pages.find((p) => p.id === id);
}

export function savePage(page) {
	const db = readDatabase();
	const index = db.pages.findIndex((p) => p.id === page.id);
	
	// Debug logging
	console.log('[DB] Saving page:', {
		id: page.id,
		hasSections: !!page.sections,
		sectionsCount: page.sections?.length || 0,
		sectionsTypes: page.sections?.map(s => s.type) || []
	});
	
	if (index >= 0) {
		// CRITICAL: Preserve sections and other fields that might not be in the incoming page object
		// Only update fields that are actually provided in the page object
		const existingPage = db.pages[index];
		
		// Special handling for churches page: preserve the churches-grid section content
		// This section is managed separately in the church management area, but order can be changed
		let mergedSections = [];
		if (page.id === 'churches') {
			// Find the existing churches-grid section to preserve its content (columns)
			const existingChurchesGrid = existingPage.sections?.find(s => s.id === 'churches-grid');
			
			// Use incoming sections to preserve order, but merge churches-grid content
			if (page.sections !== undefined) {
				mergedSections = page.sections.map(section => {
					// If this is the churches-grid section, preserve the columns from existing
					if (section.id === 'churches-grid' && existingChurchesGrid) {
						return {
							...section, // Keep the new position and other properties
							columns: existingChurchesGrid.columns || section.columns // Preserve the actual church data
						};
					}
					return section;
				});
				
				// If churches-grid wasn't in incoming sections but exists, add it at the end
				if (existingChurchesGrid && !mergedSections.find(s => s.id === 'churches-grid')) {
					mergedSections.push(existingChurchesGrid);
				}
			} else {
				// No sections provided, keep existing ones
				mergedSections = existingPage.sections || [];
			}
		} else {
			// For other pages, use the incoming sections if provided
			mergedSections = page.sections !== undefined ? page.sections : (existingPage.sections || []);
		}
		
		// Merge the page data, but explicitly handle sections and other complex fields
		const updatedPage = {
			...existingPage,
			...page,
			// Use the merged sections (which preserves churches-grid for churches page)
			sections: mergedSections,
			// Preserve other important fields
			heroMessages: page.heroMessages !== undefined ? page.heroMessages : (existingPage.heroMessages || []),
			heroButtons: page.heroButtons !== undefined ? page.heroButtons : (existingPage.heroButtons || []),
			// Preserve navigation fields
			showInNavigation: page.showInNavigation !== undefined ? page.showInNavigation : (existingPage.showInNavigation !== undefined ? existingPage.showInNavigation : true),
			navigationLabel: page.navigationLabel !== undefined ? page.navigationLabel : (existingPage.navigationLabel || ''),
			navigationOrder: page.navigationOrder !== undefined ? page.navigationOrder : (existingPage.navigationOrder !== undefined ? existingPage.navigationOrder : 999),
		};
		
		console.log('[DB] Updated page sections:', {
			before: existingPage.sections?.length || 0,
			after: updatedPage.sections?.length || 0,
			preservedChurchesGrid: page.id === 'churches' ? !!updatedPage.sections.find(s => s.id === 'churches-grid') : 'N/A'
		});
		
		db.pages[index] = updatedPage;
	} else {
		// New page - ensure sections and other fields are initialized
		const newPage = {
			...page,
			sections: page.sections || [],
			heroMessages: page.heroMessages || [],
			heroButtons: page.heroButtons || [],
			showInNavigation: page.showInNavigation !== undefined ? page.showInNavigation : true,
			navigationLabel: page.navigationLabel || '',
			navigationOrder: page.navigationOrder !== undefined ? page.navigationOrder : 999,
		};
		console.log('[DB] Creating new page with sections:', newPage.sections?.length || 0);
		db.pages.push(newPage);
	}
	writeDatabase(db);
	
	// Verify what was saved
	const savedPage = db.pages.find((p) => p.id === page.id);
	console.log('[DB] Verified saved page:', {
		id: savedPage?.id,
		hasSections: !!savedPage?.sections,
		sectionsCount: savedPage?.sections?.length || 0
	});
}

export function deletePage(id) {
	const db = readDatabase();
	db.pages = db.pages.filter((p) => p.id !== id);
	writeDatabase(db);
}

// CRUD operations for Team
export function getTeam() {
	const db = readDatabase();
	return db.team || [];
}

export function getTeamMember(id) {
	const db = readDatabase();
	return db.team.find((t) => t.id === id);
}

export function saveTeamMember(member) {
	const db = readDatabase();
	const index = db.team.findIndex((t) => t.id === member.id);
	if (index >= 0) {
		db.team[index] = member;
	} else {
		db.team.push(member);
	}
	writeDatabase(db);
}

export function deleteTeamMember(id) {
	const db = readDatabase();
	db.team = db.team.filter((t) => t.id !== id);
	writeDatabase(db);
}

// CRUD operations for Navigation Links
export function getNavigationLinks() {
	const db = readDatabase();
	return db.navigationLinks || [];
}

export function getNavigationLink(id) {
	const db = readDatabase();
	return db.navigationLinks?.find((link) => link.id === id);
}

export function saveNavigationLink(link) {
	const db = readDatabase();
	if (!db.navigationLinks) {
		db.navigationLinks = [];
	}
	const index = db.navigationLinks.findIndex((l) => l.id === link.id);
	if (index >= 0) {
		db.navigationLinks[index] = link;
	} else {
		// Generate ID if not provided
		if (!link.id) {
			link.id = `nav-link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		}
		db.navigationLinks.push(link);
	}
	writeDatabase(db);
}

export function deleteNavigationLink(id) {
	const db = readDatabase();
	if (db.navigationLinks) {
		db.navigationLinks = db.navigationLinks.filter((l) => l.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Services
export function getServices() {
	const db = readDatabase();
	return db.services || [];
}

export function getService(id) {
	const db = readDatabase();
	return db.services?.find((s) => s.id === id);
}

export function saveService(service) {
	const db = readDatabase();
	const index = db.services.findIndex((s) => s.id === service.id);
	if (index >= 0) {
		db.services[index] = service;
	} else {
		db.services.push(service);
	}
	writeDatabase(db);
}

export function deleteService(id) {
	const db = readDatabase();
	db.services = db.services.filter((s) => s.id !== id);
	writeDatabase(db);
}

// CRUD operations for Activities
export function getActivities() {
	const db = readDatabase();
	// DO NOT auto-write on read - this could overwrite production data
	// Only initialize in memory if missing
	if (!db.activities) {
		db.activities = [];
	}
	return db.activities || [];
}

export function getActivity(id) {
	const db = readDatabase();
	return db.activities?.find((a) => a.id === id);
}

export function saveActivity(activity) {
	const db = readDatabase();
	if (!db.activities) {
		db.activities = [];
	}
	const index = db.activities.findIndex((a) => a.id === activity.id);
	if (index >= 0) {
		db.activities[index] = activity;
	} else {
		db.activities.push(activity);
	}
	writeDatabase(db);
}

export function deleteActivity(id) {
	const db = readDatabase();
	if (db.activities) {
		db.activities = db.activities.filter((a) => a.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Hero Slides
export function getHeroSlides() {
	const db = readDatabase();
	return db.heroSlides || [];
}

export function saveHeroSlide(slide) {
	const db = readDatabase();
	const index = db.heroSlides.findIndex((s) => s.id === slide.id);
	if (index >= 0) {
		db.heroSlides[index] = slide;
	} else {
		db.heroSlides.push(slide);
	}
	writeDatabase(db);
}

export function deleteHeroSlide(id) {
	const db = readDatabase();
	db.heroSlides = db.heroSlides.filter((s) => s.id !== id);
	writeDatabase(db);
}

// Contact info operations
export function getContactInfo() {
	const db = readDatabase();
	return db.contact || defaultDatabase.contact;
}

export function saveContactInfo(contact) {
	const db = readDatabase();
	db.contact = contact;
	writeDatabase(db);
}

// Service times operations
export function getServiceTimes() {
	const db = readDatabase();
	return db.serviceTimes || defaultDatabase.serviceTimes;
}

export function saveServiceTimes(times) {
	const db = readDatabase();
	db.serviceTimes = times;
	writeDatabase(db);
}

// Settings operations
export function getSettings() {
	const db = readDatabase();
	return db.settings || defaultDatabase.settings;
}

export function saveSettings(settings) {
	const db = readDatabase();
	db.settings = { ...db.settings, ...settings };
	writeDatabase(db);
}

// Home page operations
export function getHome() {
	const db = readDatabase();
	return db.home || defaultDatabase.home;
}

export function saveHome(home) {
	const db = readDatabase();
	db.home = { ...db.home, ...home };
	writeDatabase(db);
}

// CRUD operations for Images
export function getImages() {
	const db = readDatabase();
	return db.images || [];
}

export function getImage(id) {
	const db = readDatabase();
	return db.images.find((img) => img.id === id);
}

export function saveImage(image) {
	const db = readDatabase();
	const index = db.images.findIndex((img) => img.id === image.id);
	if (index >= 0) {
		db.images[index] = image;
	} else {
		db.images.push(image);
	}
	writeDatabase(db);
}

export function deleteImage(id) {
	const db = readDatabase();
	db.images = db.images.filter((img) => img.id !== id);
	writeDatabase(db);
}

// CRUD operations for Podcasts
export function getPodcasts() {
	const db = readDatabase();
	return (db.podcasts || []).sort((a, b) => {
		// Sort by published date, newest first
		return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
	});
}

export function getPodcast(id) {
	const db = readDatabase();
	return db.podcasts.find((p) => p.id === id);
}

export function savePodcast(podcast) {
	const db = readDatabase();
	const index = db.podcasts.findIndex((p) => p.id === podcast.id);
	if (index >= 0) {
		db.podcasts[index] = podcast;
	} else {
		// Generate GUID if not provided
		if (!podcast.guid) {
			podcast.guid = podcast.id;
		}
		db.podcasts.push(podcast);
	}
	writeDatabase(db);
}

export function deletePodcast(id) {
	const db = readDatabase();
	db.podcasts = db.podcasts.filter((p) => p.id !== id);
	writeDatabase(db);
}

// CRUD operations for Community Groups
export function getCommunityGroups() {
	const db = readDatabase();
	// DO NOT auto-write on read - this could overwrite production data
	// Only initialize in memory if missing
	if (!db.communityGroups) {
		db.communityGroups = [];
	}
	return db.communityGroups || [];
}

export function getCommunityGroup(id) {
	const db = readDatabase();
	return db.communityGroups?.find((g) => g.id === id);
}

export function saveCommunityGroup(group) {
	const db = readDatabase();
	if (!db.communityGroups) {
		db.communityGroups = [];
	}
	const index = db.communityGroups.findIndex((g) => g.id === group.id);
	if (index >= 0) {
		db.communityGroups[index] = group;
	} else {
		db.communityGroups.push(group);
	}
	writeDatabase(db);
}

export function deleteCommunityGroup(id) {
	const db = readDatabase();
	if (db.communityGroups) {
		db.communityGroups = db.communityGroups.filter((g) => g.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Events
export function getEvents() {
	const db = readDatabase();
	// DO NOT auto-write on read - this could overwrite production data
	// Only initialize in memory if missing
	if (!db.events) {
		db.events = [];
	}
	return db.events || [];
}

export function getEvent(id) {
	const db = readDatabase();
	return db.events?.find((e) => e.id === id);
}

export function saveEvent(event) {
	const db = readDatabase();
	if (!db.events) {
		db.events = [];
	}
	const index = db.events.findIndex((e) => e.id === event.id);
	if (index >= 0) {
		db.events[index] = event;
	} else {
		db.events.push(event);
	}
	writeDatabase(db);
}

export function deleteEvent(id) {
	const db = readDatabase();
	if (db.events) {
		db.events = db.events.filter((e) => e.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Churches
export function getChurches(options = {}) {
	const db = readDatabase();
	// Get churches from the churches page section
	const churchesPage = db.pages?.find((p) => p.id === 'churches');
	if (churchesPage && churchesPage.sections) {
		const churchesSection = churchesPage.sections.find((s) => s.id === 'churches-grid');
		if (churchesSection && churchesSection.columns) {
			let churches = churchesSection.columns.map((col, index) => ({
				id: col.id || `church-${index}`,
				title: col.title || '',
				link: col.link || col.content?.match(/href="([^"]*)"/)?.[1] || '',
				image: col.image || '',
				content: col.content || '',
				showOnFrontEnd: col.showOnFrontEnd !== undefined ? col.showOnFrontEnd : true,
				showInConference: col.showInConference !== undefined ? col.showInConference : false,
				hideFromAll: col.hideFromAll !== undefined ? col.hideFromAll : false
			}));
			
			// Apply filters based on options
			if (options.frontEndOnly) {
				churches = churches.filter(c => c.showOnFrontEnd && !c.hideFromAll);
			}
			if (options.conferenceOnly) {
				churches = churches.filter(c => c.showInConference && !c.hideFromAll);
			}
			if (options.excludeHidden) {
				churches = churches.filter(c => !c.hideFromAll);
			}
			
			return churches;
		}
	}
	return [];
}

export function getChurch(id) {
	const churches = getChurches();
	return churches.find((c) => c.id === id);
}

export function saveChurch(church) {
	const db = readDatabase();
	
	// Find or create churches page
	let churchesPage = db.pages?.find((p) => p.id === 'churches');
	if (!churchesPage) {
		churchesPage = {
			id: 'churches',
			title: 'The Churches',
			heroTitle: 'The <span style="color:#0693ad;">Churches</span>',
			heroSubtitle: 'Churches in the Mission Life Grace Network',
			heroImage: '',
			heroOverlay: 40,
			metaDescription: 'The churches in the Mission Life Grace network',
			content: '',
			published: true,
			order: 2,
			sections: [],
			navigationOrder: 1,
			showInNavigation: true,
			navigationLabel: 'Churches'
		};
		if (!db.pages) db.pages = [];
		db.pages.push(churchesPage);
	}
	
	// Find or create churches-grid section
	let churchesSection = churchesPage.sections?.find((s) => s.id === 'churches-grid');
	if (!churchesSection) {
		churchesSection = {
			type: 'columns',
			id: 'churches-grid',
			backgroundColor: 'gray-50',
			padding: 'large',
			columnCount: 3,
			maxWidth: 'full',
			columns: []
		};
		if (!churchesPage.sections) churchesPage.sections = [];
		churchesPage.sections.push(churchesSection);
	}
	
	// Generate content HTML from link if not provided
	if (!church.content && church.link) {
		const domain = church.link.replace(/^https?:\/\//, '').replace(/\/$/, '');
		church.content = `<p><a href="${church.link}" target="_blank">www.${domain}</a></p>`;
	}
	
	// Generate ID if not provided
	if (!church.id) {
		church.id = `church-${church.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
	}
	
	// Update or add church
	if (!churchesSection.columns) churchesSection.columns = [];
	const index = churchesSection.columns.findIndex((c) => c.id === church.id);
	const churchData = {
		id: church.id,
		title: church.title,
		link: church.link,
		image: church.image,
		content: church.content,
		showOnFrontEnd: church.showOnFrontEnd !== undefined ? church.showOnFrontEnd : true,
		showInConference: church.showInConference !== undefined ? church.showInConference : false,
		hideFromAll: church.hideFromAll !== undefined ? church.hideFromAll : false
	};
	if (index >= 0) {
		churchesSection.columns[index] = churchData;
	} else {
		churchesSection.columns.push(churchData);
	}
	
	writeDatabase(db);
}

export function deleteChurch(id) {
	const db = readDatabase();
	const churchesPage = db.pages?.find((p) => p.id === 'churches');
	if (churchesPage && churchesPage.sections) {
		const churchesSection = churchesPage.sections.find((s) => s.id === 'churches-grid');
		if (churchesSection && churchesSection.columns) {
			churchesSection.columns = churchesSection.columns.filter((c) => c.id !== id);
			writeDatabase(db);
		}
	}
}

// ========== CONFERENCE MANAGEMENT FUNCTIONS ==========

// CRUD operations for Conferences
export function getConferences() {
	const db = readDatabase();
	if (!db.conferences) {
		db.conferences = [];
	}
	return db.conferences || [];
}

export function getConference(id) {
	const db = readDatabase();
	return db.conferences?.find((c) => c.id === id);
}

export function getConferenceBySlug(slug) {
	const db = readDatabase();
	return db.conferences?.find((c) => c.slug === slug);
}

export function saveConference(conference) {
	const db = readDatabase();
	if (!db.conferences) {
		db.conferences = [];
	}
	const index = db.conferences.findIndex((c) => c.id === conference.id);
	if (index >= 0) {
		db.conferences[index] = conference;
	} else {
		// Generate slug if not provided
		if (!conference.slug && conference.title) {
			conference.slug = conference.title.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
		}
		db.conferences.push(conference);
	}
	writeDatabase(db);
}

export function deleteConference(id) {
	const db = readDatabase();
	if (db.conferences) {
		db.conferences = db.conferences.filter((c) => c.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Conference Ticket Types
export function getConferenceTicketTypes(conferenceId) {
	const db = readDatabase();
	if (!db.conferenceTicketTypes) {
		db.conferenceTicketTypes = [];
	}
	return db.conferenceTicketTypes.filter((t) => t.conferenceId === conferenceId) || [];
}

export function getConferenceTicketType(id) {
	const db = readDatabase();
	return db.conferenceTicketTypes?.find((t) => t.id === id);
}

export function saveConferenceTicketType(ticketType) {
	const db = readDatabase();
	if (!db.conferenceTicketTypes) {
		db.conferenceTicketTypes = [];
	}
	const index = db.conferenceTicketTypes.findIndex((t) => t.id === ticketType.id);
	if (index >= 0) {
		db.conferenceTicketTypes[index] = ticketType;
	} else {
		db.conferenceTicketTypes.push(ticketType);
	}
	writeDatabase(db);
}

export function deleteConferenceTicketType(id) {
	const db = readDatabase();
	if (db.conferenceTicketTypes) {
		db.conferenceTicketTypes = db.conferenceTicketTypes.filter((t) => t.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Conference Bookings
export function getConferenceBookings(conferenceId = null) {
	const db = readDatabase();
	if (!db.conferenceBookings) {
		db.conferenceBookings = [];
	}
	if (conferenceId) {
		return db.conferenceBookings.filter((b) => b.conferenceId === conferenceId) || [];
	}
	return db.conferenceBookings || [];
}

export function getConferenceBooking(id) {
	const db = readDatabase();
	return db.conferenceBookings?.find((b) => b.id === id);
}

export function saveConferenceBooking(booking) {
	const db = readDatabase();
	if (!db.conferenceBookings) {
		db.conferenceBookings = [];
	}
	const index = db.conferenceBookings.findIndex((b) => b.id === booking.id);
	if (index >= 0) {
		db.conferenceBookings[index] = booking;
	} else {
		// Generate booking ID if not provided
		if (!booking.id) {
			booking.id = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		}
		// Generate booking reference
		if (!booking.bookingReference) {
			booking.bookingReference = `CONF-${Date.now().toString(36).toUpperCase()}`;
		}
		db.conferenceBookings.push(booking);
	}
	writeDatabase(db);
}

export function deleteConferenceBooking(id) {
	const db = readDatabase();
	if (db.conferenceBookings) {
		db.conferenceBookings = db.conferenceBookings.filter((b) => b.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Conference Attendees
export function getConferenceAttendees(bookingId = null) {
	const db = readDatabase();
	if (!db.conferenceAttendees) {
		db.conferenceAttendees = [];
	}
	if (bookingId) {
		return db.conferenceAttendees.filter((a) => a.bookingId === bookingId) || [];
	}
	return db.conferenceAttendees || [];
}

export function getConferenceAttendee(id) {
	const db = readDatabase();
	return db.conferenceAttendees?.find((a) => a.id === id);
}

export function saveConferenceAttendee(attendee) {
	const db = readDatabase();
	if (!db.conferenceAttendees) {
		db.conferenceAttendees = [];
	}
	const index = db.conferenceAttendees.findIndex((a) => a.id === attendee.id);
	if (index >= 0) {
		db.conferenceAttendees[index] = attendee;
	} else {
		// Generate attendee ID if not provided
		if (!attendee.id) {
			attendee.id = `attendee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		}
		// Generate ticket ID
		if (!attendee.ticketId) {
			attendee.ticketId = `TICKET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
		}
		db.conferenceAttendees.push(attendee);
	}
	writeDatabase(db);
}

export function deleteConferenceAttendee(id) {
	const db = readDatabase();
	if (db.conferenceAttendees) {
		db.conferenceAttendees = db.conferenceAttendees.filter((a) => a.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Conference Discount Codes
export function getConferenceDiscountCodes(conferenceId = null) {
	const db = readDatabase();
	if (!db.conferenceDiscountCodes) {
		db.conferenceDiscountCodes = [];
	}
	if (conferenceId) {
		return db.conferenceDiscountCodes.filter((d) => d.conferenceId === conferenceId) || [];
	}
	return db.conferenceDiscountCodes || [];
}

export function getConferenceDiscountCode(code, conferenceId = null) {
	const db = readDatabase();
	return db.conferenceDiscountCodes?.find((d) => {
		if (d.code.toLowerCase() !== code.toLowerCase()) return false;
		if (conferenceId && d.conferenceId !== conferenceId) return false;
		return true;
	});
}

export function saveConferenceDiscountCode(discountCode) {
	const db = readDatabase();
	if (!db.conferenceDiscountCodes) {
		db.conferenceDiscountCodes = [];
	}
	const index = db.conferenceDiscountCodes.findIndex((d) => d.id === discountCode.id);
	if (index >= 0) {
		db.conferenceDiscountCodes[index] = discountCode;
	} else {
		db.conferenceDiscountCodes.push(discountCode);
	}
	writeDatabase(db);
}

export function deleteConferenceDiscountCode(id) {
	const db = readDatabase();
	if (db.conferenceDiscountCodes) {
		db.conferenceDiscountCodes = db.conferenceDiscountCodes.filter((d) => d.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Conference Payment Schedules
export function getConferencePaymentSchedules(bookingId = null) {
	const db = readDatabase();
	if (!db.conferencePaymentSchedules) {
		db.conferencePaymentSchedules = [];
	}
	if (bookingId) {
		return db.conferencePaymentSchedules.filter((p) => p.bookingId === bookingId) || [];
	}
	return db.conferencePaymentSchedules || [];
}

export function getConferencePaymentSchedule(id) {
	const db = readDatabase();
	return db.conferencePaymentSchedules?.find((p) => p.id === id);
}

export function saveConferencePaymentSchedule(paymentSchedule) {
	const db = readDatabase();
	if (!db.conferencePaymentSchedules) {
		db.conferencePaymentSchedules = [];
	}
	const index = db.conferencePaymentSchedules.findIndex((p) => p.id === paymentSchedule.id);
	if (index >= 0) {
		db.conferencePaymentSchedules[index] = paymentSchedule;
	} else {
		db.conferencePaymentSchedules.push(paymentSchedule);
	}
	writeDatabase(db);
}

export function deleteConferencePaymentSchedule(id) {
	const db = readDatabase();
	if (db.conferencePaymentSchedules) {
		db.conferencePaymentSchedules = db.conferencePaymentSchedules.filter((p) => p.id !== id);
		writeDatabase(db);
	}
}

// CRUD operations for Conference Form Fields
export function getConferenceFormFields(formType = null) {
	const db = readDatabase();
	if (!db.conferenceFormFields) {
		db.conferenceFormFields = [];
	}
	if (formType) {
		return db.conferenceFormFields.filter((f) => f.formType === formType) || [];
	}
	return db.conferenceFormFields || [];
}

export function getConferenceFormField(id) {
	const db = readDatabase();
	return db.conferenceFormFields?.find((f) => f.id === id);
}

export function saveConferenceFormField(formField) {
	const db = readDatabase();
	if (!db.conferenceFormFields) {
		db.conferenceFormFields = [];
	}
	const index = db.conferenceFormFields.findIndex((f) => f.id === formField.id);
	if (index >= 0) {
		db.conferenceFormFields[index] = formField;
	} else {
		if (!formField.id) {
			formField.id = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		}
		// Set order if not provided
		if (formField.order === undefined) {
			const maxOrder = db.conferenceFormFields
				.filter(f => f.formType === formField.formType)
				.reduce((max, f) => Math.max(max, f.order || 0), 0);
			formField.order = maxOrder + 1;
		}
		db.conferenceFormFields.push(formField);
	}
	writeDatabase(db);
	return formField;
}

export function deleteConferenceFormField(id) {
	const db = readDatabase();
	if (db.conferenceFormFields) {
		db.conferenceFormFields = db.conferenceFormFields.filter((f) => f.id !== id);
		writeDatabase(db);
	}
}

// ========== POLICY PAGES FUNCTIONS ==========

export function getPolicy(policyType) {
	const db = readDatabase();
	if (!db.policies) {
		db.policies = defaultDatabase.policies;
		writeDatabase(db);
	}
	return db.policies[policyType] || null;
}

export function savePolicy(policyType, policyData) {
	const db = readDatabase();
	if (!db.policies) {
		db.policies = {};
	}
	db.policies[policyType] = {
		...policyData,
		lastUpdated: new Date().toISOString()
	};
	writeDatabase(db);
	return db.policies[policyType];
}

export function getAllPolicies() {
	const db = readDatabase();
	if (!db.policies) {
		db.policies = defaultDatabase.policies;
		writeDatabase(db);
	}
	return db.policies;
}

// Health check
export function checkDatabaseHealth() {
	const dbPath = getDbPath();
	const exists = existsSync(dbPath);
	const isAbsolute = dbPath.startsWith('/');

	return {
		path: dbPath,
		exists,
		isAbsolute,
		volumeMounted: isAbsolute && exists
	};
}
