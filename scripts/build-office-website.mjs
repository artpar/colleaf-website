import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'website');
const output = path.join(source, 'dist');
const config = JSON.parse(await readFile(path.join(source, 'office-site.json'), 'utf8'));
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(config.domain)) throw new Error('Invalid website domain');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let html = await readFile(path.join(source, 'index.template.html'), 'utf8');
html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in config)) throw new Error(`Missing website metadata: ${key}`);
  return escape(config[key]);
});
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'index.html'), html);
for (const file of ['office.css', 'office.js', 'office.svg']) await copyFile(path.join(source, file), path.join(output, file));
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'CNAME'), `${config.domain}\n`);
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: https://${config.domain}/sitemap.xml\n`);
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${config.domain}/</loc></url></urlset>\n`);
console.log(`Built static website: ${output}`);
