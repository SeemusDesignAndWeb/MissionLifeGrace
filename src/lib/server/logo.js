import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

let cachedLogo = '';

export function getMlgLogoBase64() {
    if (cachedLogo) return cachedLogo;

    try {
        const cwd = process.cwd();
        // Try multiple potential paths
        const pathsToTry = [
            join(cwd, 'static/images/mlg-logo.png'),
            join(cwd, 'public/images/mlg-logo.png'), // Sometimes static is mapped to public
            join(cwd, '../static/images/mlg-logo.png'), // If cwd is inside a subdir
            resolve('static/images/mlg-logo.png')
        ];

        for (const p of pathsToTry) {
            if (existsSync(p)) {
                console.log(`[Logo] Found logo at: ${p}`);
                cachedLogo = readFileSync(p).toString('base64');
                return cachedLogo;
            }
        }

        console.error('[Logo] Could not find mlg-logo.png in any expected location:', pathsToTry);
    } catch (error) {
        console.error('[Logo] Failed to load MLG logo:', error);
    }

    return '';
}

