#!/usr/bin/env node
/*
 * Image pipeline: turns the source screenshots in src/shots/ into the
 * optimised variants the site actually serves from project/assets/img/.
 *
 *   <id>-card.webp   720px wide, used by gallery cards (lazy-loaded)
 *   <id>.webp        1280px wide max, used on the project detail page
 *   <id>-og.jpg      1200x630 JPEG for social previews (WebP is not
 *                    universally supported by link scrapers)
 *
 * Files whose name starts with "_" are art sources for the CSS-rendered
 * open-source cards and are cropped rather than resized.
 *
 * Run:  npm run images      (needs `npm install` for sharp)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'src', 'shots');
const OUT = path.join(__dirname, '..', 'project', 'assets', 'img');
fs.mkdirSync(OUT, { recursive: true });

const WEBP = { quality: 78, effort: 6 };
const JPEG = { quality: 80, mozjpeg: true };

async function screenshot(file) {
  const id = path.basename(file, '.png');
  const input = sharp(path.join(SRC, file));
  const meta = await input.metadata();
  const cardW = Math.min(720, meta.width);
  const fullW = Math.min(1280, meta.width);
  await sharp(path.join(SRC, file)).resize({ width: cardW }).webp(WEBP).toFile(path.join(OUT, `${id}-card.webp`));
  await sharp(path.join(SRC, file)).resize({ width: fullW }).webp(WEBP).toFile(path.join(OUT, `${id}.webp`));
  // OG: 1200x630, crop from the top (most screenshots have their identity there)
  await sharp(path.join(SRC, file))
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'top' })
    .jpeg(JPEG)
    .toFile(path.join(OUT, `${id}-og.jpg`));
  const full = await sharp(path.join(OUT, `${id}.webp`)).metadata();
  return { id, width: full.width, height: full.height };
}

// Site-wide social preview: wordmark + tagline over the neuron artwork.
async function siteOg() {
  const W = 1200, H = 630;
  const art = await sharp(path.join(SRC, '_neurons.png')).resize({ height: H }).toBuffer();
  const logo = await sharp(path.join(__dirname, '..', 'project', 'assets', 'xorio-logo-white.svg')).resize({ width: 380 }).png().toBuffer();
  const fade = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0.45" stop-color="#0B1120" stop-opacity="1"/><stop offset="0.8" stop-color="#0B1120" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
  const text = Buffer.from(`<svg width="${W}" height="${H}">
    <style>.t{font-family:'Space Grotesk','DejaVu Sans',Arial,sans-serif;fill:#fff;font-weight:700;font-size:54px;letter-spacing:-1px}.s{font-family:'DejaVu Sans Mono','JetBrains Mono',monospace;fill:#8FA3D8;font-size:22px;letter-spacing:3px}.u{font-family:'DejaVu Sans',Arial,sans-serif;fill:#B9C2D8;font-size:24px}</style>
    <text x="80" y="150" class="s">// SOFTWARE CRAFTSMANSHIP, IN THE OPEN</text>
    <text x="80" y="330" class="t">Open source,</text>
    <text x="80" y="392" class="t">built in the open.</text>
    <text x="80" y="460" class="u">A Rust &amp; STEM open-source collective · xorio.rs</text>
  </svg>`);
  await sharp({ create: { width: W, height: H, channels: 3, background: '#0B1120' } })
    .composite([{ input: art, left: W - H, top: 0 }, { input: fade, left: 0, top: 0 }, { input: logo, left: 80, top: 190 }, { input: text, left: 0, top: 0 }])
    .jpeg(JPEG).toFile(path.join(__dirname, '..', 'project', 'assets', 'og.jpg'));
}

async function crops() {
  // Shared dark starfield used behind every CSS-rendered open-source card.
  // The source card has text on its left; take the text-free right strip and
  // mirror it to build a full-width, seamless starfield.
  const strip = await sharp(path.join(SRC, '_oss-bg.png')).extract({ left: 720, top: 0, width: 480, height: 520 }).toBuffer();
  const mirrored = await sharp(strip).flop().toBuffer();
  const wide = await sharp({ create: { width: 1440, height: 520, channels: 3, background: '#0B1120' } })
    .composite([{ input: mirrored, left: 0, top: 0 }, { input: strip, left: 480, top: 0 }, { input: mirrored, left: 960, top: 0 }])
    .png().toBuffer();
  await sharp(wide).resize({ width: 1200 }).webp({ quality: 70, effort: 6 }).toFile(path.join(OUT, 'oss-bg.webp'));
  // Per-project art shown on the right of a few cards.
  await sharp(path.join(SRC, '_neurons.png')).resize({ height: 630 })
    .webp(WEBP).toFile(path.join(OUT, 'art-rencfs.webp'));
  await sharp(path.join(SRC, '_grpc-card.png')).extract({ left: 880, top: 190, width: 250, height: 250 })
    .webp(WEBP).toFile(path.join(OUT, 'art-capnproto.webp'));
}

(async () => {
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.png'));
  const dims = {};
  for (const f of files) {
    if (f.startsWith('_')) continue;
    const d = await screenshot(f);
    dims[d.id] = { width: d.width, height: d.height };
    console.log('ok', d.id, d.width + 'x' + d.height);
  }
  await crops();
  await siteOg();
  fs.writeFileSync(path.join(OUT, 'dims.json'), JSON.stringify(dims, null, 1) + '\n');
  console.log('wrote', Object.keys(dims).length, 'screenshots + 3 crops');
})().catch(e => { console.error(e); process.exit(1); });
