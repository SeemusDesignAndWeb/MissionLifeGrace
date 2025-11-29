#!/usr/bin/env node

/**
 * Script to add churches to the database
 * Usage: node scripts/add-churches.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data/database.json');

// Read existing database
let db;
try {
	const dbContent = readFileSync(DB_PATH, 'utf-8');
	db = JSON.parse(dbContent);
} catch (error) {
	console.error('Failed to read database:', error.message);
	process.exit(1);
}

// Default churches to add (from https://www.missionlifegrace.net/vision)
const defaultChurches = [
	{
		id: 'eltham-green-community-church',
		title: 'Eltham Green Community Church',
		link: 'https://www.egcc.co.uk',
		image: 'https://res.cloudinary.com/dl8kjhwjs/image/upload/v1763397479/egcc/d79861b6-c071-4bb9-9665-299a4a7d20bf.svg',
		content: '<p><a href="https://www.egcc.co.uk" target="_blank">www.egcc.co.uk</a></p>',
		showOnFrontEnd: true,
		showInConference: true,
		hideFromAll: false
	},
	{
		id: 'river-church',
		title: 'River Church',
		link: 'https://www.river-church.co.uk',
		image: '',
		content: '<p><a href="https://www.river-church.co.uk" target="_blank">www.river-church.co.uk</a></p>',
		showOnFrontEnd: true,
		showInConference: true,
		hideFromAll: false
	},
	{
		id: 'clifton-community-church',
		title: 'Clifton Community Church',
		link: 'https://www.cliftoncommunitychurch.org.uk',
		image: '',
		content: '<p><a href="https://www.cliftoncommunitychurch.org.uk" target="_blank">www.cliftoncommunitychurch.org.uk</a></p>',
		showOnFrontEnd: true,
		showInConference: true,
		hideFromAll: false
	},
	{
		id: 'city-church-chester',
		title: 'City Church Chester',
		link: 'https://www.citychurchchester.co.uk',
		image: '',
		content: '<p><a href="https://www.citychurchchester.co.uk" target="_blank">www.citychurchchester.co.uk</a></p>',
		showOnFrontEnd: true,
		showInConference: true,
		hideFromAll: false
	},
	{
		id: 'heathfield-community-church',
		title: 'Heathfield Community Church',
		link: 'https://www.heathfieldcommunitychurch.com',
		image: '',
		content: '<p><a href="https://www.heathfieldcommunitychurch.com" target="_blank">www.heathfieldcommunitychurch.com</a></p>',
		showOnFrontEnd: true,
		showInConference: true,
		hideFromAll: false
	},
	{
		id: 'epsom-christian-fellowship',
		title: 'Epsom Christian Fellowship',
		link: 'https://www.epsomchristianfellowship.org.uk',
		image: '',
		content: '<p><a href="https://www.epsomchristianfellowship.org.uk" target="_blank">www.epsomchristianfellowship.org.uk</a></p>',
		showOnFrontEnd: true,
		showInConference: true,
		hideFromAll: false
	}
];

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

// Ensure columns array exists
if (!churchesSection.columns) {
	churchesSection.columns = [];
}

// Add churches that don't already exist
let addedCount = 0;
for (const church of defaultChurches) {
	const exists = churchesSection.columns.some((c) => c.id === church.id);
	if (!exists) {
		churchesSection.columns.push(church);
		addedCount++;
		console.log(`✓ Added: ${church.title}`);
	} else {
		console.log(`- Already exists: ${church.title}`);
	}
}

// Write back to database
try {
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
	console.log(`\n✓ Successfully added ${addedCount} church(es) to database`);
	console.log(`Total churches in database: ${churchesSection.columns.length}`);
} catch (error) {
	console.error('Failed to write database:', error.message);
	process.exit(1);
}

