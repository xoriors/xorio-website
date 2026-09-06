/* Browser behaviour for the prerendered pages: theme switch, gallery
   filtering/search on the home page, the hero terminal, and redirects for
   the old hash URLs. No content is rendered here — see src/render.js. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var DISCORD = 'https://discord.gg/3W3mwWvz8y';
  var GITHUB = 'https://github.com/xoriors';

  // ── Legacy hash routes (#p/<id>, #about, …) → real paths ─────────
  var legacy = /^#\/?(p\/([A-Za-z0-9_-]+)|about|experiments|contribute)$/.exec(location.hash || '');
  if (legacy) {
    var target = legacy[2] ? '/p/' + legacy[2] : '/' + legacy[1];
    if (location.pathname.replace(/\/$/, '') !== target) { location.replace(target); return; }
  }

  // ── Theme ────────────────────────────────────────────────────────
  function applyTheme(t, persist) {
    t = t === 'light' ? 'light' : 'mono';
    document.documentElement.setAttribute('data-theme', t);
    if (persist) { try { localStorage.setItem('xorio-theme', t); } catch (e) {} }
    var sw = $('theme-toggle');
    if (sw) {
      sw.setAttribute('aria-checked', String(t === 'light'));
      sw.title = t === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    }
  }
  applyTheme(document.documentElement.getAttribute('data-theme'), false);
  var toggle = $('theme-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'mono' : 'light', true);
  });

  // Sticky filter bar sits under the nav; the nav height varies (wraps on
  // small screens), so measure it and expose it as --navH.
  function setNavH() { var n = $('nav'); if (n) document.documentElement.style.setProperty('--navH', n.offsetHeight + 'px'); }
  window.addEventListener('resize', setNavH); setNavH();

  // ── GitHub cards (About page) ─────────────────────────────────────
  // Built in the browser from the GitHub API (60 req/h per visitor is
  // plenty), cached for a day. Colours/widths are set through the CSSOM,
  // never as style attributes, so the strict CSP stays intact.
  var LANG_COLORS = { Rust: '#dea584', Python: '#3572A5', Shell: '#89e051', Kotlin: '#A97BFF', Java: '#b07219', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#663399', Go: '#00ADD8', 'C++': '#f34b7d', C: '#555555', Dockerfile: '#384d54', Ruby: '#701516', Dart: '#00B4AB', Swift: '#F05138' };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function renderGithubCards(d) {
    var st = $('gh-stats-card'), lg = $('gh-langs-card');
    if (!st || !lg) return;
    st.textContent = ''; st.appendChild(el('div', 'gh-card-title', 'github — radumarias'));
    var rows = el('div', 'gh-rows');
    [[d.stars, 'stars earned'], [d.followers, 'followers'], [d.repos, 'public repos'], [d.forks, 'forks of his work']].forEach(function (r) {
      var row = el('div', 'gh-row'); row.appendChild(el('span', 'gh-num', Number(r[0]).toLocaleString())); row.appendChild(el('span', 'gh-lbl', r[1])); rows.appendChild(row);
    });
    st.appendChild(rows);
    var total = d.langs.reduce(function (a, x) { return a + x[1]; }, 0) || 1;
    lg.textContent = ''; lg.appendChild(el('div', 'gh-card-title', 'top languages'));
    var bar = el('div', 'gh-bar'), legend = el('div', 'gh-legend');
    d.langs.forEach(function (x) {
      var seg = el('span', 'gh-bar-seg'); seg.style.width = (x[1] / total * 100).toFixed(1) + '%'; seg.style.background = LANG_COLORS[x[0]] || '#8B8F98'; bar.appendChild(seg);
      var item = el('span'); var dot = el('span', 'gh-dot'); dot.style.background = LANG_COLORS[x[0]] || '#8B8F98'; item.appendChild(dot); item.appendChild(document.createTextNode(x[0] + ' ' + (x[1] / total * 100).toFixed(0) + '%')); legend.appendChild(item);
    });
    lg.appendChild(bar); lg.appendChild(legend);
  }
  function loadGithubCards() {
    if (!$('gh-stats-card')) return;
    var KEY = 'xorio-gh-cards';
    try { var c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && Date.now() - c.at < 864e5) { renderGithubCards(c.d); return; } } catch (e) {}
    var j = function (r) { return r.json(); };
    Promise.all([
      fetch('https://api.github.com/users/radumarias').then(j),
      fetch('https://api.github.com/users/radumarias/repos?per_page=100&page=1&type=owner').then(j),
      fetch('https://api.github.com/users/radumarias/repos?per_page=100&page=2&type=owner').then(j)
    ]).then(function (res) {
      var u = res[0], repos = [].concat(Array.isArray(res[1]) ? res[1] : [], Array.isArray(res[2]) ? res[2] : []).filter(function (x) { return !x.fork; });
      if (!u || typeof u.followers !== 'number' || !repos.length) throw new Error('rate limited');
      var counts = {}; repos.forEach(function (x) { if (x.language) counts[x.language] = (counts[x.language] || 0) + 1; });
      var d = {
        stars: repos.reduce(function (a, x) { return a + x.stargazers_count; }, 0),
        forks: repos.reduce(function (a, x) { return a + x.forks_count; }, 0),
        followers: u.followers, repos: u.public_repos,
        langs: Object.keys(counts).map(function (k) { return [k, counts[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6)
      };
      try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), d: d })); } catch (e) {}
      renderGithubCards(d);
    }).catch(function () { /* fallback links are already in the markup */ });
  }
  loadGithubCards();

  // Everything below is home-page only.
  var gallery = $('gallery-content');
  if (!gallery) return;

  var cards = Array.prototype.slice.call(gallery.querySelectorAll('.project-card'));
  var groups = Array.prototype.slice.call(gallery.querySelectorAll('.group'));
  var FILTER_KEYS = Array.prototype.map.call(document.querySelectorAll('#filter-chips [data-filter]'), function (a) { return a.dataset.filter; });
  var siteData = {}; try { siteData = JSON.parse($('site-data').textContent); } catch (e) {}
  var currentFilter = 'all', currentQuery = '';

  function matches(card) {
    var ok = currentFilter === 'all' ? true
      : currentFilter === 'app' ? card.dataset.kind === 'app'
      : currentFilter === 'oss' ? card.dataset.kind === 'oss'
      : (' ' + card.dataset.cats + ' ').indexOf(' ' + currentFilter + ' ') > -1;
    if (ok && currentQuery) ok = card.dataset.search.indexOf(currentQuery.toLowerCase()) > -1;
    return ok;
  }
  function applyFilter() {
    var any = false;
    cards.forEach(function (c) { var m = matches(c); c.hidden = !m; any = any || m; });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.project-card:not([hidden])'); });
    $('no-results').hidden = any;
    document.querySelectorAll('#filter-chips [data-filter]').forEach(function (a) {
      var on = a.dataset.filter === currentFilter;
      a.classList.toggle('active', on); a.classList.toggle('inactive', !on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.nav-links [data-nav]').forEach(function (a) {
      var on = (a.dataset.nav === 'oss' && currentFilter === 'oss') || (a.dataset.nav === 'home' && currentFilter !== 'oss');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function scrollGallery(instant) {
    var el = $('projects'); if (!el) return;
    var navH = $('nav').offsetHeight, barH = $('filter-bar').offsetHeight;
    var y = el.getBoundingClientRect().top + window.scrollY - navH - barH - 14;
    if (Math.abs(window.scrollY - y) < 2) return;
    window.scrollTo({ top: y, behavior: instant ? 'auto' : 'smooth' });
  }
  function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  // The hash is the single source of truth for the filter: #f/<key>
  // filters, #projects shows everything and jumps to the gallery,
  // #terminal focuses the shell.
  function applyRoute(userInitiated) {
    var h = location.hash.replace(/^#\/?/, '');
    var f = 'all', m = /^f\/([a-z]+)$/.exec(h);
    if (m && FILTER_KEYS.indexOf(m[1]) > -1) f = m[1];
    if (m && FILTER_KEYS.indexOf(m[1]) === -1) history.replaceState(null, '', location.pathname + location.search);
    var changed = f !== currentFilter || currentQuery;
    currentFilter = f; currentQuery = '';
    applyFilter();
    if (f !== 'all' || h === 'projects') scrollGallery(!userInitiated);
    else if (h === 'terminal') { scrollTop(); focusTerminal(); }
    else if (changed && userInitiated) scrollGallery(false);
  }
  window.addEventListener('hashchange', function () { applyRoute(true); });
  applyRoute(false);

  // ── Terminal ─────────────────────────────────────────────────────
  var termOut = $('term-output'), termIn = $('term-input'), lines = [];
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function renderTerm() {
    termOut.innerHTML = lines.map(function (l) {
      if (l.k === 'cmd') return '<div class="term-line-cmd">' + esc(l.t) + '</div>';
      if (l.k === 'err') return '<div class="term-line-err">' + esc(l.t) + '</div>';
      if (l.k === 'sys') return '<div class="term-line-sys">' + esc(l.t) + '</div>';
      if (l.cmd) return '<div class="term-line-out"><span class="term-cmd-name">' + esc(l.cmd) + '</span>' + esc(l.t) + '</div>';
      return '<div class="term-line-out">' + esc(l.t) + '</div>';
    }).join('');
    termOut.scrollTop = termOut.scrollHeight;
  }
  // Seed with the prerendered banner lines.
  Array.prototype.forEach.call(termOut.children, function (el) { lines.push({ k: 'sys', t: el.textContent }); });
  function push(out) { lines = lines.concat(out); renderTerm(); }
  function focusTerminal() { setTimeout(function () { termIn.focus(); }, 80); }
  function projects() {
    return cards.map(function (c) { return { id: c.dataset.id, name: c.dataset.name, kind: c.dataset.kind, blurb: c.dataset.blurb }; });
  }
  function findProject(q) {
    q = (q || '').toLowerCase().trim(); if (!q) return null;
    var list = projects();
    return list.filter(function (p) { return p.id === q; })[0]
      || list.filter(function (p) { return p.name.toLowerCase().indexOf(q) > -1; })[0]
      || list.filter(function (p) { return p.id.indexOf(q) > -1; })[0] || null;
  }
  var FILTER_ALIASES = { apps: 'app', app: 'app', oss: 'oss', open: 'oss', 'open-source': 'oss', ai: 'ai', media: 'media', video: 'media', fs: 'fs', filesystem: 'fs', filesystems: 'fs', crypto: 'fs', rust: 'fs', dev: 'devtools', devtools: 'devtools', tools: 'devtools', realtime: 'realtime', maps: 'maps', weather: 'maps', geo: 'maps', systems: 'systems', sim: 'sim', sims: 'sim', simulation: 'sim', simulations: 'sim', physics: 'sim', all: 'all' };
  function setFilter(f) {
    var h = f === 'all' ? '#projects' : '#f/' + f;
    if (location.hash === h) applyRoute(true); else location.hash = h;
  }
  function runCommand(raw) {
    var cmd = (raw || '').trim(); termIn.value = ''; if (!cmd) return;
    var out = [{ k: 'cmd', t: '$ ' + cmd }];
    var parts = cmd.split(/\s+/), c = parts[0].toLowerCase(), arg = parts.slice(1).join(' ');
    if (c === 'help') {
      out.push({ k: 'sys', t: 'available commands —' });
      [['help', ' list all commands'], ['ls / ls apps / ls oss / ls experiments', ' list projects'], ['open <name>', " jump to a project's page (e.g. open rencfs)"],
       ['filter <tag>', ' filter the gallery (e.g. filter rust)'], ['search <query>', ' search across projects'], ['discord / github', ' open those links'],
       ['contribute / experiments / about', ' go to those pages'], ['whoami', ' about xorio'], ['clear', ' clear the terminal']
      ].forEach(function (r) { out.push({ k: 'out', cmd: r[0], t: '  — ' + r[1] }); });
      push(out);
    } else if (c === 'ls') {
      var a = arg.toLowerCase();
      if (a.indexOf('exp') === 0) {
        (siteData.experiments || []).slice(0, 8).forEach(function (t) { out.push({ k: 'out', t: '◇ ' + t }); });
        out.push({ k: 'out', t: '… ' + (siteData.experiments || []).length + ' total — run: experiments' });
      } else {
        var list = projects();
        if (a.indexOf('app') === 0) list = list.filter(function (p) { return p.kind === 'app'; });
        else if (a.indexOf('oss') === 0 || a.indexOf('open') === 0) list = list.filter(function (p) { return p.kind === 'oss'; });
        list.forEach(function (p) { out.push({ k: 'out', t: (p.kind === 'app' ? '● ' : '◆ ') + p.id + '  —  ' + p.blurb }); });
      }
      push(out);
    } else if (c === 'open') {
      var p = findProject(arg);
      if (p) { out.push({ k: 'out', t: 'opening ' + p.name + ' …' }); push(out); location.href = '/p/' + encodeURIComponent(p.id); }
      else { out.push({ k: 'err', t: "no project matches '" + arg + "'" }); push(out); }
    } else if (c === 'filter') {
      var f = FILTER_ALIASES[arg.toLowerCase()] || arg.toLowerCase() || 'all';
      if (f !== 'all' && FILTER_KEYS.indexOf(f) === -1) { out.push({ k: 'err', t: 'unknown filter: ' + arg }); push(out); }
      else { out.push({ k: 'out', t: 'filtering: ' + f }); push(out); setFilter(f); }
    } else if (c === 'search') {
      out.push({ k: 'out', t: 'searching: ' + arg }); push(out);
      history.replaceState(null, '', location.pathname + location.search);
      currentFilter = 'all'; currentQuery = arg; applyFilter(); setTimeout(scrollGallery, 40);
    } else if (c === 'discord') { out.push({ k: 'out', t: 'opening Discord →' }); push(out); window.open(DISCORD, '_blank', 'noopener,noreferrer'); }
    else if (c === 'github') { out.push({ k: 'out', t: 'opening github.com/xoriors →' }); push(out); window.open(GITHUB, '_blank', 'noopener,noreferrer'); }
    else if (c === 'contribute' || c === 'contact') { push(out); location.href = '/contribute'; }
    else if (c === 'experiments') { push(out); location.href = '/experiments'; }
    else if (c === 'about') { push(out); location.href = '/about'; }
    else if (c === 'clear') { lines = []; renderTerm(); }
    else if (c === 'whoami') { out.push({ k: 'out', t: 'xorio — a Rust & STEM open-source collective. Software craftsmanship taken to perfection.' }); push(out); }
    else { out.push({ k: 'err', t: 'command not found: ' + c + " — try 'help'" }); push(out); }
  }
  termIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') runCommand(e.target.value); });
  // Clicking anywhere in the terminal focuses the input (unless selecting text).
  $('terminal').addEventListener('click', function (e) {
    if (e.target.tagName === 'INPUT') return;
    if (String(window.getSelection && window.getSelection() || '')) return;
    termIn.focus();
  });
  window.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); scrollTop(); focusTerminal(); return; }
    if (e.key === '/') {
      var tag = (e.target && e.target.tagName) || '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); scrollTop(); focusTerminal(); }
    }
  });
  var cmdBtn = $('nav-cmd-btn');
  if (cmdBtn) cmdBtn.addEventListener('click', function (e) { e.preventDefault(); scrollTop(); focusTerminal(); });
})();
