#!/usr/bin/env node

/**
 * Script to add the Conferences page to the database
 * Usage: node scripts/add-conferences-page.js
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

// Initialize pages array if it doesn't exist
if (!db.pages) {
	db.pages = [];
}

// Check if conferences page already exists
const existingPage = db.pages.find(p => p.id === 'conferences');
if (existingPage) {
	console.log('✓ Conferences page already exists in database');
	process.exit(0);
}

// Create the conferences page
const conferencesPage = {
	id: 'conferences',
	title: 'Conferences',
	heroTitle: 'Conferences',
	heroSubtitle: 'Join us for our upcoming conferences',
	heroImage: '/images/activities-bg.jpg',
	heroOverlay: 40,
	metaDescription: 'Join us for our upcoming conferences and events',
	content: '',
	published: true,
	showInNavigation: true,
	navigationLabel: 'Conferences',
	navigationOrder: 1,
	sections: []
};

// Add to pages array
db.pages.push(conferencesPage);

// Write back to database
try {
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
	console.log('✓ Successfully added Conferences page to database');
	console.log('  - ID: conferences');
	console.log('  - Navigation Order: 1 (appears first)');
	console.log('  - You can now edit this page in Admin → Pages');
} catch (error) {
	console.error('Failed to write database:', error.message);
	process.exit(1);
}

