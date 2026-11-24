import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'website');
const output = path.join(source, 'dist');
const config = JSON.parse(await readFile(path.join(source, 'office-site.json'), 'utf8'));
const screens = JSON.parse(await readFile(path.join(source, 'office-screens.json'), 'utf8'));
const pages = JSON.parse(await readFile(path.join(source, 'office-pages.json'), 'utf8'));
const release = JSON.parse(await readFile(path.join(source, 'office-downloads.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(release.version) || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/tag\/[\w.-]+$/.test(release.url)) throw new Error('Invalid download release');
const releaseBase = release.url.replace('/tag/', '/download/');
const downloads = Object.fromEntries(Object.entries(release.assets).map(([key, name]) => {
  if (!/^[\w.-]+$/.test(name)) throw new Error('Invalid download filename');
  return [key, `${releaseBase}/${name}`];
}));
const data = { ...config, ...downloads, release_version: release.version, release_url: release.url };
for (const screen of screens) {
  if (!/^office-[a-z-]+\.png$/.test(screen.file) || !screen.label || !screen.alt) throw new Error('Invalid screenshot metadata');
}
for (const page of pages) {
  if (!/^[a-z-]+\.html$/.test(page.file) || !/^(?:pages\/)?[a-z.-]+\.html$/.test(page.template)) throw new Error('Invalid page metadata');
}
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(config.domain)) throw new Error('Invalid website domain');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const interpolate = (html, data) => html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in data)) throw new Error(`Missing website metadata: ${key}`);
  return escape(data[key]);
});
const metadataText = text => text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in config)) throw new Error(`Missing website metadata: ${key}`);
  return String(config[key]);
});
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const assets = new Map();
for (const file of ['office.css', 'office.svg', ...screens.map(screen => screen.file)]) {
  const bytes = await readFile(path.join(source, file));
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const extension = path.extname(file);
  const versionedFile = `${path.basename(file, extension)}.${hash}${extension}`;
  assets.set(file, versionedFile);
  await writeFile(path.join(output, versionedFile), bytes);
  if (extension === '.png') {
    const screen = screens.find(screen => screen.file === file);
    const title = escape(`${config.product} — ${screen.label}`);
    const viewer = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>body{margin:0;background:#f3f3f3;font:14px system-ui;color:#444}p{margin:12px 20px}img{display:block;max-width:none;margin:0 auto;filter:grayscale(1)}</style></head><body><p>${escape(screen.label)} · Actual product with fictional project data</p><img src="./${versionedFile}" width="${screen.width}" height="${screen.height}" alt="${escape(screen.alt)}"></body></html>`;
    await writeFile(path.join(output, `${path.basename(file, extension)}.html`), viewer);
  }
}
const layout = await readFile(path.join(source, 'layout.template.html'), 'utf8');
const navItems = [['workspace', 'Workspace'], ['communication', 'Mail & contacts'], ['scheduling', 'Calendar & booking'], ['deployment', 'How it runs'], ['downloads', 'Downloads']];
for (const page of pages) {
  const content = interpolate(await readFile(path.join(source, page.template), 'utf8'), data);
  const navigation = navItems.map(([key, label]) => `<a href="./${key}.html"${page.nav === key ? ' aria-current="page"' : ''}>${escape(label)}</a>`).join('');
  const pageUrl = `https://${config.domain}/${page.file === 'index.html' ? '' : page.file}`;
  let html = interpolate(layout.replace('{{content}}', () => content).replace('{{navigation}}', () => navigation), {
    ...config, page_title: metadataText(page.title), page_description: metadataText(page.description), page_url: pageUrl,
  });
  for (const [file, versionedFile] of assets) html = html.replaceAll(`./${file}`, `./${versionedFile}`);
  await writeFile(path.join(output, page.file), html);
}
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'CNAME'), `${config.domain}\n`);
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: https://${config.domain}/sitemap.xml\n`);
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page => `<url><loc>https://${config.domain}/${page.file === 'index.html' ? '' : page.file}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${pages.length} product pages: ${output}`);
