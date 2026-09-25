#!/usr/bin/env node
/*
 * Local development: build, serve dist/ like Vercel does, and rebuild +
 * reload the browser whenever a source file changes.
 *
 *   npm run dev            http://localhost:8000  (PORT or first argument)
 *
 * Watches src/, project/ and build.js. A failed build keeps serving the
 * last good output and shows the error in the page until the next save.
 * The reload script is served from this origin, so it runs under the same
 * CSP as production (script-src 'self', connect-src 'self').
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createServer } = require('./serve');

const REPO = path.join(__dirname, '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8000);
const WATCH = ['src', 'project', 'build.js'];

const clients = new Set();
let lastError = null;
function broadcast(event, data) {
  for (const res of clients) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function build() {
  const t = Date.now();
  const r = spawnSync(process.execPath, ['build.js'], { cwd: REPO, encoding: 'utf8' });
  if (r.status === 0) {
    lastError = null;
    console.log(`${(r.stdout || '').trim()}  [${Date.now() - t} ms]`);
    return true;
  }
  lastError = ((r.stderr || '') + (r.stdout || '')).trim() || `build.js exited with ${r.status}`;
  console.error('\nBuild failed — still serving the last good output:\n' + lastError + '\n');
  return false;
}

// Client: reload on a successful rebuild; show build errors as an overlay.
// Styles are set through CSSOM because the CSP forbids inline style attributes.
const RELOAD_JS = `(function () {
  var box;
  function show(msg) {
    if (!box) {
      box = document.createElement('pre');
      var s = box.style;
      s.position = 'fixed'; s.left = s.right = s.bottom = '12px'; s.zIndex = 99999; s.margin = 0;
      s.maxHeight = '45vh'; s.overflow = 'auto'; s.padding = '14px 16px'; s.borderRadius = '10px';
      s.background = '#2a0d0d'; s.color = '#ffb4b4'; s.font = '12px/1.5 ui-monospace, monospace'; s.whiteSpace = 'pre-wrap';
      document.body.appendChild(box);
    }
    box.textContent = 'npm run dev — build failed, showing the last good build:\\n\\n' + msg;
  }
  var es = new EventSource('/__dev/events');
  es.addEventListener('reload', function () { location.reload(); });
  es.addEventListener('build-error', function (e) { show(JSON.parse(e.data)); });
})();
`;

const dev = {
  handle(req, res) {
    if (req.url === '/__dev/reload.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
      res.end(RELOAD_JS);
      return true;
    }
    if (req.url === '/__dev/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      if (lastError) res.write(`event: build-error\ndata: ${JSON.stringify(lastError)}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return true;
    }
    return false;
  },
  inject(html) {
    return html.replace('</body>', '<script src="/__dev/reload.js"></script>\n</body>');
  }
};

// Coalesce bursts of events (editors write files in several steps) and
// never run two builds at once.
let timer = null, building = false, again = false;
function schedule(file) {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (building) { again = true; return; }
    building = true;
    console.log(`changed: ${file}`);
    if (build()) broadcast('reload', {}); else broadcast('build-error', lastError);
    building = false;
    if (again) { again = false; schedule('(queued change)'); }
  }, 120);
}

build();
for (const w of WATCH) {
  const abs = path.join(REPO, w);
  if (!fs.existsSync(abs)) continue;
  const isDir = fs.statSync(abs).isDirectory();
  fs.watch(abs, { recursive: isDir }, (_, name) => {
    if (name && /(^|[\\/])\.|~$|\.swp$/.test(name)) return;   // editor temp files
    schedule(isDir ? path.join(w, name || '') : w);
  });
}

createServer(dev)
  .on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is in use: try \`PORT=8001 npm run dev\`.` : e); process.exit(1); })
  .listen(PORT, () => console.log(`\nxorio.rs dev server → http://localhost:${PORT}/  (edit src/ — pages rebuild and reload on save)\n`));
