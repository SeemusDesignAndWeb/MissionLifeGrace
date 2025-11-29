import { readFileSync, writeFileSync } from 'fs';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function removeDuplicateImages() {
	try {
		console.log('🚀 Starting duplicate image removal...\n');
		
		// Read current database
		const dbPath = process.env.DATABASE_PATH || join(__dirname, '../data/database.json');
		
		if (!existsSync(dbPath)) {
			console.error(`❌ Database file not found: ${dbPath}`);
			process.exit(1);
		}
		
		const dbData = readFileSync(dbPath, 'utf-8');
		const db = JSON.parse(dbData);
		
		const existingImages = db.images || [];
		console.log(`📋 Found ${existingImages.length} images in database\n`);
		
		// Track statistics
		let duplicatesRemoved = 0;
		const keptImages = [];
		
		// Track seen public IDs and paths to identify duplicates
		const seenPublicIds = new Set();
		const seenPaths = new Set();
		
		// Process each image
		for (const image of existingImages) {
			const publicId = image.cloudinaryPublicId;
			const path = image.path;
			
			let isDuplicate = false;
			
			// Check for duplicates by public ID (preferred method)
			if (publicId && seenPublicIds.has(publicId)) {
				console.log(`🗑️  Removing duplicate (by public ID): ${image.filename || image.originalName || 'unknown'} (${publicId})`);
				duplicatesRemoved++;
				isDuplicate = true;
			}
			
			// Check for duplicates by path (fallback if no public ID)
			if (!isDuplicate && path && seenPaths.has(path)) {
				console.log(`🗑️  Removing duplicate (by path): ${image.filename || image.originalName || 'unknown'} (${path.substring(0, 80)}...)`);
				duplicatesRemoved++;
				isDuplicate = true;
			}
			
			if (!isDuplicate) {
				// Keep this image
				if (publicId) seenPublicIds.add(publicId);
				if (path) seenPaths.add(path);
				keptImages.push(image);
			}
		}
		
		// Update database
		db.images = keptImages;
		
		// Write database
		writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
		console.log(`💾 Database saved to: ${dbPath}`);
		
		console.log(`\n✅ Cleanup complete!`);
		console.log(`   Duplicates removed: ${duplicatesRemoved}`);
		console.log(`   Images kept: ${keptImages.length}`);
		console.log(`   Total in database: ${keptImages.length} images\n`);
		
	} catch (error) {
		console.error('❌ Error removing duplicates:', error);
		process.exit(1);
	}
}

// Run the cleanup
removeDuplicateImages();


