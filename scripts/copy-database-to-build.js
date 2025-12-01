#!/usr/bin/env node

/**
 * Copy database.json to build directory after build
 * This ensures the database is available in production
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourcePath = join(__dirname, '../data/database.json');
const buildPath = join(__dirname, '../build/data/database.json');

try {
	if (!existsSync(sourcePath)) {
		console.warn('[Build] Database file not found at:', sourcePath);
		console.warn('[Build] Skipping database copy to build directory');
		process.exit(0);
	}

	// Ensure build/data directory exists
	const buildDir = dirname(buildPath);
	mkdirSync(buildDir, { recursive: true });

	// Copy database to build directory
	copyFileSync(sourcePath, buildPath);
	console.log('[Build] Successfully copied database.json to build directory');
} catch (error) {
	console.error('[Build] Failed to copy database to build directory:', error.message);
	// Don't fail the build if database copy fails
	process.exit(0);
}

