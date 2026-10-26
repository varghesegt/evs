import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('[Static Routes] dist/index.html not found! Run vite build first.');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');

// List of all SPA routes to generate static HTML directories for
const routes = [
  'login',
  'register',
  'donor',
  'donor/create',
  'donor/history',
  'ngo',
  'ngo/incoming',
  'ngo/assign',
  'volunteer',
  'volunteer/active',
  'volunteer/deliver',
  'admin',
  'admin/users',
  'admin/analytics',
  'admin/reports',
  'admin/mission-control',
];

console.log('[Static Routes] Generating static route directories for GitHub Pages (0 status 404)...');

routes.forEach((route) => {
  const targetDir = path.join(distDir, route);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), indexContent);
});

// Ensure 404.html and .nojekyll exist
if (!fs.existsSync(path.join(distDir, '404.html'))) {
  fs.writeFileSync(path.join(distDir, '404.html'), indexContent);
}

if (!fs.existsSync(path.join(distDir, '.nojekyll'))) {
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
}

console.log(`[Static Routes] Successfully generated ${routes.length} static routes for GitHub Pages.`);
