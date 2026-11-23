import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'website');
const output = path.join(source, 'dist');
const config = JSON.parse(await readFile(path.join(source, 'office-site.json'), 'utf8'));
const screens = JSON.parse(await readFile(path.join(source, 'office-screens.json'), 'utf8'));
for (const screen of screens) {
  if (!/^office-[a-z-]+\.png$/.test(screen.file) || !screen.label || !screen.alt) throw new Error('Invalid screenshot metadata');
}
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(config.domain)) throw new Error('Invalid website domain');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let html = await readFile(path.join(source, 'index.template.html'), 'utf8');
html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in config)) throw new Error(`Missing website metadata: ${key}`);
  return escape(config[key]);
});
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['office.css', 'office.svg', ...screens.map(screen => screen.file)]) {
  const bytes = await readFile(path.join(source, file));
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const extension = path.extname(file);
  const versionedFile = `${path.basename(file, extension)}.${hash}${extension}`;
  html = html.replaceAll(`./${file}`, `./${versionedFile}`);
  await writeFile(path.join(output, versionedFile), bytes);
  if (extension === '.png') {
    const screen = screens.find(screen => screen.file === file);
    const label = screen.label;
    const title = escape(`${config.product} — ${label}`);
    const viewer = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>body{margin:0;background:#f3f3f3;font:14px system-ui;color:#444}p{margin:12px 20px}img{display:block;max-width:none;margin:0 auto;filter:grayscale(1)}</style></head><body><p>${escape(label)} · Actual product with fictional project data</p><img src="./${versionedFile}" width="${screen.width}" height="${screen.height}" alt="${escape(screen.alt)}"></body></html>`;
    await writeFile(path.join(output, `${path.basename(file, extension)}.html`), viewer);
  }
}
await writeFile(path.join(output, 'index.html'), html);
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'CNAME'), `${config.domain}\n`);
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: https://${config.domain}/sitemap.xml\n`);
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${config.domain}/</loc></url></urlset>\n`);
console.log(`Built static website: ${output}`);
