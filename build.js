#!/usr/bin/env node
/*
 * Static site build for xorio.rs. No dependencies beyond Node ≥ 20.
 *
 *   node build.js          write every page + sitemap/robots + assets
 *   node build.js --check  exit 1 if the committed output is stale
 *
 * Inputs:  src/*  project/data/stats.json  project/assets/img/dims.json
 * Outputs: index.html  p/<id>.html  about.html  experiments.html
 *          f/<key>.html  contribute.html  privacy.html  404.html  sitemap.xml  robots.txt
 *          project/assets/{site.css,app.js,theme.js}
 *
 * Every page is complete HTML (crawlers and link previews need no JS);
 * app.js only adds the terminal, filtering and the theme switch.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const D = require('./src/data');
const R = require('./src/render');
const CHECK = process.argv.includes('--check');

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const readJson = f => JSON.parse(read(f));
const stats = fs.existsSync(path.join(ROOT, 'project/data/stats.json')) ? readJson('project/data/stats.json') : {};
const dims = fs.existsSync(path.join(ROOT, 'project/assets/img/dims.json')) ? readJson('project/assets/img/dims.json') : {};

// Generated assets are copied first so their hashes are known to asset().
const generated = {};

const outputs = {};   // path -> content (strings)
function emit(file, content) { outputs[file] = content; }

const hashCache = {};
function asset(p) {
  p = p.replace(/^\//, '');
  if (!(p in hashCache)) {
    const content = generated[p] !== undefined ? Buffer.from(generated[p]) : (fs.existsSync(path.join(ROOT, p)) ? fs.readFileSync(path.join(ROOT, p)) : null);
    if (content === null) throw new Error(`asset not found: ${p}`);
    hashCache[p] = crypto.createHash('sha1').update(content).digest('hex').slice(0, 8);
  }
  return `/${p}?v=${hashCache[p]}`;
}
// CSS-referenced files (fonts, the repo-card starfield) get the same ?v=
// hash as everything else, so the font preloads match the @font-face URLs
// and the immutable cache rule can never pin a stale file.
generated['project/assets/site.css'] = read('src/styles.css').replace(/url\((fonts|img)\/([^)]+)\)/g, (_, dir, f) => `url(${asset(`project/assets/${dir}/${f}`)})`);
generated['project/assets/app.js'] = read('src/app.js');
generated['project/assets/theme.js'] = read('src/theme.js');
const ctx = { asset, dims, stats };

const shell = read('src/shell.html');
function page({ file, page: pageId, title, description, canonical, ogImage, jsonld, body, nav, headExtra }) {
  // Function replacers throughout: a `$&`, `$'` or `$$` in content must
  // never be read as a replacement pattern.
  const lit = v => () => v;
  let html = shell
    .replace(/\{\{a:([^}]+)\}\}/g, (_, p) => asset(p))
    .replace(/\{\{title\}\}/g, lit(R.esc(title)))
    .replace(/\{\{description\}\}/g, lit(R.esc(description)))
    .replace(/\{\{canonical\}\}/g, lit(R.esc(canonical)))
    .replace(/\{\{og_image\}\}/g, lit(R.esc(ogImage)))
    .replace(/\{\{jsonld\}\}/g, lit(JSON.stringify(jsonld).replace(/</g, '\\u003c')))
    .replace(/\{\{head_extra\}\}/g, lit(headExtra || ''))
    .replace(/\{\{page\}\}/g, lit(pageId))
    .replace(/\{\{body\}\}/g, lit(body));
  if (nav) html = html.replace(`data-nav="${nav}"`, `data-nav="${nav}" aria-current="page"`);
  emit(file, html);
}

const SITE = D.SITE.url;
const ORG = {
  '@type': 'Organization', name: 'xorio', url: SITE + '/', logo: SITE + asset('project/assets/favicon-512.png'), email: D.SITE.email,
  founder: { '@type': 'Person', name: 'Radu Marias', url: D.SITE.founderGithub },
  sameAs: [D.SITE.github, D.SITE.founderGithub, D.SITE.discord, D.SITE.linkedin]
};
const OG_DEFAULT = SITE + asset('project/assets/og.jpg');

// ── Pages ──────────────────────────────────────────────
page({
  file: 'index.html', page: 'home', nav: 'home',
  title: D.SITE.title, description: D.SITE.description, canonical: SITE + '/', ogImage: OG_DEFAULT,
  jsonld: { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebSite', name: 'xorio', url: SITE + '/' }] },
  body: R.home(ctx)
});

// One prerendered page per filter (/f/<key>): linkable, crawlable, and
// the gallery arrives already filtered even without JavaScript.
for (const f of D.FILTERS.filter(x => x.key !== 'all')) {
  page({
    file: `f/${f.key}.html`, page: 'home', nav: f.key === 'oss' ? 'oss' : f.key === 'app' ? 'home' : null,
    title: `${f.label} — xorio`, description: `${f.label} projects from the xorio open-source collective.`,
    canonical: `${SITE}/f/${f.key}`, ogImage: OG_DEFAULT,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${f.label} — xorio`, url: `${SITE}/f/${f.key}`, isPartOf: { '@type': 'WebSite', name: 'xorio', url: SITE + '/' } },
    body: R.home(ctx, f.key)
  });
}
for (const p of D.PROJECTS) {
  const url = `${SITE}/p/${p.id}`;
  const og = p.shot ? SITE + asset(`project/assets/img/${p.shot}-og.jpg`) : OG_DEFAULT;
  const ld = p.kind === 'app'
    ? { '@context': 'https://schema.org', '@type': 'WebApplication', name: p.name, description: p.blurb, url: p.live || url, applicationCategory: 'WebApplication', operatingSystem: 'Any', author: ORG, ...(p.repo ? { codeRepository: p.repo } : {}) }
    : { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: p.name, description: p.blurb, url, codeRepository: p.repo, programmingLanguage: (p.tech || [])[0], author: ORG };
  page({
    file: `p/${p.id}.html`, page: 'detail', nav: null,
    title: `${p.name} — xorio`, description: p.blurb, canonical: url, ogImage: og, jsonld: ld,
    body: R.detail(p, ctx)
  });
}

page({ file: 'experiments.html', page: 'experiments', nav: 'experiments',
  title: 'Experiments & open ideas — xorio', description: `xorio's backlog of ${D.EXPERIMENTS.length} open experiments — agent tooling, security, filesystems and more. Many have no contributors yet; you could be the first.`,
  canonical: SITE + '/experiments', ogImage: OG_DEFAULT, jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Experiments & open ideas', url: SITE + '/experiments', isPartOf: { '@type': 'WebSite', url: SITE + '/' } },
  body: R.experiments(ctx) });

page({ file: 'about.html', page: 'about', nav: 'about',
  title: 'About — xorio', description: 'xorio is a Rust & STEM open-source collective founded by Radu Marias: high-performance systems, robust web services and secure applications, built in the open.',
  canonical: SITE + '/about', ogImage: OG_DEFAULT, jsonld: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About xorio', url: SITE + '/about', mainEntity: ORG },
  body: R.about(ctx) });

page({ file: 'contribute.html', page: 'contribute', nav: 'contribute',
  title: 'Contribute — xorio', description: 'How to build with the xorio collective: pick a project, claim an issue, ship in the open. Discord, GitHub, email and good first issues.',
  canonical: SITE + '/contribute', ogImage: OG_DEFAULT, jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Contribute', url: SITE + '/contribute', isPartOf: { '@type': 'WebSite', url: SITE + '/' } },
  body: R.contribute(ctx) });

page({ file: 'privacy.html', page: 'privacy', nav: null,
  title: 'Privacy Policy — xorio', description: "Privacy policy for xorio's websites and mobile applications, including our Android apps published on Google Play.",
  canonical: SITE + '/privacy', ogImage: OG_DEFAULT, jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Privacy Policy', url: SITE + '/privacy' },
  body: read('src/privacy.html') });

page({ file: '404.html', page: 'notfound', nav: null,
  title: 'Not found — xorio', description: 'This page does not exist.', canonical: SITE + '/404', ogImage: OG_DEFAULT,
  jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Not found' },
  headExtra: '<meta name="robots" content="noindex">',
  body: R.notFound() });

// ── sitemap / robots ───────────────────────────────────
const urls = [[SITE + '/', '1.0'], [SITE + '/experiments', '0.8'], [SITE + '/about', '0.8'], [SITE + '/contribute', '0.8'], [SITE + '/privacy', '0.2']]
  .concat(D.FILTERS.filter(f => f.key !== 'all').map(f => [`${SITE}/f/${f.key}`, '0.6']))
  .concat(D.PROJECTS.map(p => [`${SITE}/p/${p.id}`, '0.7']));
emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([u, pr]) => `  <url><loc>${u}</loc><priority>${pr}</priority></url>`).join('\n') + '\n</urlset>\n');
emit('robots.txt', `User-agent: *\nAllow: /\nDisallow: /404\n\nSitemap: ${SITE}/sitemap.xml\n`);

Object.assign(outputs, generated);

// ── Write or check ─────────────────────────────────────
let stale = [];
for (const [file, content] of Object.entries(outputs)) {
  const abs = path.join(ROOT, file);
  const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  const same = cur !== null && cur === content;
  if (same) continue;
  stale.push(file);
  if (!CHECK) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, content); }
}
// Remove generated pages whose project or filter no longer exists.
for (const dir of ['p', 'f']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    if (f.endsWith('.html') && !((dir + '/' + f) in outputs)) { stale.push(dir + '/' + f + ' (orphan)'); if (!CHECK) fs.unlinkSync(path.join(abs, f)); }
  }
}

if (CHECK) {
  if (stale.length) { console.error('Build output is stale. Run `npm run build` and commit:\n  ' + stale.join('\n  ')); process.exit(1); }
  console.log('Build output is up to date.');
} else {
  console.log(`Built ${Object.keys(outputs).length} files (${stale.length} changed): ${D.PROJECTS.length} project pages, ${D.EXPERIMENTS.length} experiments.`);
}
