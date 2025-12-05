import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

let cachedLogo = '';
let cachedMimeType = 'image/png'; // Default to PNG

export function getMlgLogoBase64() {
    if (cachedLogo) return cachedLogo;

    try {
        const cwd = process.cwd();
        // Try multiple potential paths - ONLY raster images (PNG, JPG, JPEG) for email compatibility
        const pathsToTry = [
            join(cwd, 'static/images/mlg-logo.png'),
            join(cwd, 'static/images/mlg-logo.jpg'),
            join(cwd, 'static/images/mlg-logo.jpeg'),
            join(cwd, 'public/images/mlg-logo.png'), // Sometimes static is mapped to public
            join(cwd, 'public/images/mlg-logo.jpg'),
            join(cwd, 'public/images/mlg-logo.jpeg'),
            join(cwd, '../static/images/mlg-logo.png'), // If cwd is inside a subdir
            join(cwd, '../static/images/mlg-logo.jpg'),
            join(cwd, '../static/images/mlg-logo.jpeg'),
            resolve('static/images/mlg-logo.png'),
            resolve('static/images/mlg-logo.jpg'),
            resolve('static/images/mlg-logo.jpeg')
        ];

        for (const p of pathsToTry) {
            if (existsSync(p)) {
                console.log(`[Logo] Found logo at: ${p}`);
                const fileContent = readFileSync(p);
                
                // Determine MIME type based on file extension
                if (p.endsWith('.jpg') || p.endsWith('.jpeg')) {
                    cachedMimeType = 'image/jpeg';
                } else if (p.endsWith('.png')) {
                    cachedMimeType = 'image/png';
                } else {
                    // Skip non-raster formats
                    console.warn(`[Logo] Skipping non-raster image format: ${p}`);
                    continue;
                }
                
                cachedLogo = fileContent.toString('base64');
                console.log(`[Logo] Successfully loaded logo as ${cachedMimeType}, size: ${cachedLogo.length} bytes (base64)`);
                return cachedLogo;
            }
        }

        console.error('[Logo] Could not find mlg-logo.png, mlg-logo.jpg, or mlg-logo.jpeg in any expected location:', pathsToTry);
    } catch (error) {
        console.error('[Logo] Failed to load MLG logo:', error);
    }

    return '';
}

export function getMlgLogoMimeType() {
    // Ensure logo is loaded
    if (!cachedLogo) {
        getMlgLogoBase64();
    }
    return cachedMimeType;
}

