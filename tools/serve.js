#!/usr/bin/env node
/*
 * Local preview that mirrors the Vercel deployment:
 *   cleanUrls  (/about -> about.html, /p/rencfs -> p/rencfs.html)
 *   trailingSlash:false and .html -> clean URL redirects (308)
 *   the response headers from vercel.json (so the CSP is enforced locally)
 *   unknown paths -> 404.html
 * Usage: node tools/serve.js [port]   (default 8000)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8000);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };

// Header rules from vercel.json, compiled once. Cache-Control is overridden
// with no-store so a rebuild is always visible in the browser.
const RULES = (() => {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    return (v.headers || []).map(h => ({ re: new RegExp('^' + h.source.replace(/\(\.\*\)/g, '(.*)') + '$'), headers: h.headers }));
  } catch (e) { return []; }
})();
function headersFor(p, type) {
  const out = { 'Content-Type': type };
  for (const r of RULES) if (r.re.test(p)) for (const h of r.headers) out[h.key] = h.value;
  out['Cache-Control'] = 'no-store';
  return out;
}

http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch (e) { res.writeHead(400, { 'Content-Type': 'text/plain' }); return res.end('Bad request'); }
  // Vercel: trailingSlash:false + cleanUrls redirect to the canonical form.
  if (p.length > 1 && p.endsWith('/')) { res.writeHead(308, { Location: p.replace(/\/+$/, '') }); return res.end(); }
  if (p.endsWith('.html')) { res.writeHead(308, { Location: p === '/index.html' ? '/' : p.slice(0, -5) }); return res.end(); }
  let file = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
  let status = 200;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { status = 404; file = path.join(ROOT, '404.html'); }
  res.writeHead(status, headersFor(p, TYPES[path.extname(file)] || 'application/octet-stream'));
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`xorio.rs preview → http://localhost:${PORT}/`));
