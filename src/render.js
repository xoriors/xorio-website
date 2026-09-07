/*
 * HTML templates. Pure functions: (data, ctx) -> string. Used only by
 * build.js at build time; the browser gets finished HTML plus app.js.
 *
 * ctx = {
 *   asset(path)  -> same path with a cache-busting ?v= query
 *   dims         -> { shotId: {width,height} } from project/assets/img/dims.json
 *   stats        -> project/data/stats.json
 * }
 */
'use strict';

const D = require('./data');

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function safeUrl(u) { u = String(u || ''); return /^(https?:|mailto:|\/(?!\/))/i.test(u) ? u : '#'; }
function ext(url, cls, label, extra) {
  return `<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer" class="${cls}"${extra || ''}>${label}</a>`;
}
function byId(id) { return D.PROJECTS.find(p => p.id === id); }
function approx(n) { if (n < 10) return String(n); const step = n >= 100 ? 50 : (n >= 20 ? 10 : 5); return Math.floor(n / step) * step + '+'; }
function counts() {
  return {
    apps: D.PROJECTS.filter(p => p.kind === 'app').length,
    repos: D.PROJECTS.filter(p => p.kind === 'oss').length,
    experiments: D.EXPERIMENTS.length
  };
}

// 'owner/repo' when the project's repo URL is a plain GitHub repository
// (sub-folders of a monorepo and GitLab projects have no stats entry).
function repoKey(p) {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?$/.exec(p.repo || '');
  return m ? `${m[1]}/${m[2]}` : null;
}
function repoPath(p) {
  const m = /^https:\/\/(?:www\.)?(github|gitlab)\.com\/(.+?)\/?$/.exec(p.repo || '');
  if (!m) return p.name;
  return (m[1] === 'gitlab' ? 'gitlab.com/' : '') + m[2].replace(/\/tree\/[^/]+\//, '/');
}
function repoStats(p, ctx) { const k = repoKey(p); return (k && ctx.stats && ctx.stats.repos && ctx.stats.repos[k]) || null; }
function isGitlab(p) { return !!(p.repo && p.repo.indexOf('gitlab') > -1); }

function status(p, ctx) {
  if (p.kind === 'app' && p.live) return { cls: 'st-live', text: '● live', long: '● live' };
  const s = repoStats(p, ctx);
  if (s && typeof s.stars === 'number') return { cls: 'st-stars', text: '★ ' + s.stars, long: '★ ' + s.stars + ' stars' };
  if (p.kind === 'app') return { cls: 'st-repo', text: '◆ source', long: '◆ source available' };
  return { cls: 'st-repo', text: '◆ repo', long: '◆ open source' };
}
function primaryLink(p) {
  if (p.live) return { url: p.live, label: 'Open ↗' };
  if (p.repo) return { url: p.repo, label: isGitlab(p) ? 'GitLab ↗' : 'GitHub ↗' };
  return null;
}
function monthYear(iso) {
  if (!iso) return null;
  const d = new Date(iso); if (isNaN(d)) return null;
  return d.toLocaleString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
function fmtNum(n) { return typeof n === 'number' ? n.toLocaleString('en') : '—'; }

// ── Media ──────────────────────────────────────────────
function shotImg(p, ctx, variant, cls, sizes) {
  const d = (ctx.dims && ctx.dims[p.shot]) || {};
  const full = { w: d.width || 1280, h: d.height || 800 };
  const w = variant === 'card' ? Math.min(720, full.w) : full.w;
  const h = Math.round(w * full.h / full.w);
  const src = ctx.asset(`project/assets/img/${p.shot}${variant === 'card' ? '-card' : ''}.webp`);
  return `<img class="${cls} fit-${p.fit === 'top' ? 'top' : 'center'}" src="${src}" width="${w}" height="${h}" alt="${esc(p.name)} screenshot" loading="lazy" decoding="async"${sizes ? ` sizes="${sizes}"` : ''}>`;
}
function ossCard(p, ctx, large) {
  const art = p.art ? `<img class="oss-art oss-art-${esc(p.art)}" src="${ctx.asset(`project/assets/img/art-${p.art}.webp`)}" alt="" loading="lazy" decoding="async">` : '';
  const host = isGitlab(p) ? '▲' : '◆';
  return `<div class="oss-card${large ? ' oss-card-lg' : ''}${p.art ? ' has-art' : ''}" role="img" aria-label="${esc(p.name)} card">${art}
    <div class="oss-card-text">
      <span class="oss-repo">${host} ${esc(repoPath(p))}</span>
      <span class="oss-name">${esc(p.name)}</span>
      ${large ? `<span class="oss-blurb">${esc(p.blurb)}</span>` : ''}
      <span class="oss-tags">${(p.tags || []).map(t => `<span class="oss-tag">${esc(t)}</span>`).join('')}</span>
    </div>
    <span class="oss-brand"><span class="oss-brand-dot"></span>xorio</span>
  </div>`;
}
function cardMedia(p, ctx) {
  return p.shot ? shotImg(p, ctx, 'card', 'card-img') : ossCard(p, ctx, false);
}

// ── Gallery ────────────────────────────────────────────
function searchText(p) {
  return [p.id, p.name, p.blurb, ...(p.tech || []), ...(p.tags || [])].join(' ').toLowerCase();
}
function card(p, ctx, hidden) {
  const st = status(p, ctx); const pl = primaryLink(p);
  return `<article ${hidden ? 'hidden ' : ''}class="project-card" data-id="${esc(p.id)}" data-kind="${esc(p.kind)}" data-cats="${esc((p.cats || []).join(' '))}" data-name="${esc(p.name)}" data-blurb="${esc(p.blurb)}" data-search="${esc(searchText(p))}">
  <a class="card-stretch" href="/p/${encodeURIComponent(p.id)}" aria-label="${esc(p.name)} — view details"></a>
  <div class="card-media">${cardMedia(p, ctx)}</div>
  <div class="card-body">
    <div class="card-header-row"><span class="card-name">${esc(p.name)}</span><span class="card-status ${st.cls}">${esc(st.text)}</span></div>
    <p class="card-blurb">${esc(p.blurb)}</p>
    <div class="card-footer">
      <div class="card-tags">${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${pl ? ext(pl.url, 'card-link', esc(pl.label)) : '<span></span>'}
    </div>
  </div>
</article>`;
}
// Filters are real pages (/f/<key>) so they can be linked and crawled;
// app.js switches between them in place with pushState.
function filterHref(key) { return key === 'all' ? '/' : `/f/${key}`; }
function projectMatches(p, f) {
  if (!f || f === 'all') return true;
  if (f === 'app' || f === 'oss') return p.kind === f;
  return (p.cats || []).indexOf(f) > -1;
}
function filters(active) {
  return D.FILTERS.map(f => {
    const on = active === f.key;
    return `<a class="filter-chip ${on ? 'active' : 'inactive'}" href="${filterHref(f.key)}" data-filter="${esc(f.key)}"${on ? ' aria-current="true"' : ''}>${esc(f.label)}</a>`;
  }).join('');
}
function gallery(ctx, active) {
  return D.GROUPS.map(g => {
    const items = g.ids.map(byId).filter(Boolean);
    const anyVisible = items.some(p => projectMatches(p, active));
    return `<section class="group" data-group="${esc(g.title)}"${anyVisible ? '' : ' hidden'}>
  <div class="group-header"><h2 class="group-title">${esc(g.title)}</h2><span class="group-line"></span></div>
  <div class="cards-grid">${items.map(p => card(p, ctx, !projectMatches(p, active))).join('\n')}</div>
</section>`;
  }).join('\n') + `\n<div class="no-results" id="no-results" hidden>no projects match — <a href="/" data-filter="all">reset filter</a></div>`;
}
function home(ctx, active) {
  active = active || 'all';
  const c = counts();
  const termData = { experiments: D.EXPERIMENTS.map(x => x.title), counts: c };
  return `<div id="hero-wrap">
  <div class="hero-inner">
    <div>
      <div class="hero-tagline">// ${esc(D.SITE.tagline)}</div>
      <h1 class="hero-h1">Open source,<br>built in the open.</h1>
      <p class="hero-sub">A Rust &amp; STEM collective. ${approx(c.apps)} live apps, an open-source core, and ${approx(c.experiments)} open experiments — pick one, claim an issue, and ship with us.</p>
      <div class="hero-btns">
        <a class="btn-primary" href="#projects" id="browse-btn">Browse projects</a>
        ${ext(D.DISCORD, 'btn-secondary', 'Join Discord →')}
      </div>
    </div>
    <div class="terminal" id="terminal">
      <div class="term-titlebar"><span class="term-dot d1"></span><span class="term-dot d2"></span><span class="term-dot d3"></span><span class="term-title">xorio — type a command</span></div>
      <div id="term-output" role="log" aria-live="polite" aria-atomic="false" tabindex="0"><div class="term-line-sys">xorio shell — ${c.apps} apps · ${c.repos} repos · ${c.experiments} experiments</div><div class="term-line-sys">type 'help' for commands, or 'ls' to list projects</div></div>
      <div class="term-input-row"><span class="term-ps1-user">xorio</span><span class="term-ps1-sep">~</span><input id="term-input" type="text" placeholder="help" aria-label="Terminal command input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
    </div>
  </div>
</div>
<script type="application/json" id="site-data">${JSON.stringify(termData).replace(/</g, '\\u003c')}</script>
<div id="filter-bar">
  <div class="filter-bar-inner"><span class="filter-label">filter</span><nav id="filter-chips" aria-label="Filter projects">${filters(active)}</nav></div>
</div>
<div id="gallery-wrap">
  <div id="projects" class="gallery-anchor"></div>
  <div id="gallery-content">${gallery(ctx, active)}</div>
</div>`;
}

// ── Detail ─────────────────────────────────────────────
function related(p, ctx) {
  const g = D.GROUPS.find(g => g.ids.indexOf(p.id) > -1);
  if (!g) return '';
  const others = g.ids.filter(id => id !== p.id).map(byId).filter(Boolean).slice(0, 3);
  if (!others.length) return '';
  return `<div class="related-section">
  <div class="arch-label">more in ${esc(g.title.toLowerCase())}</div>
  <div class="related-list">${others.map(o => `<a class="related-link" href="/p/${encodeURIComponent(o.id)}"><span class="related-name">${esc(o.name)}</span><span class="related-blurb">${esc(o.blurb)}</span></a>`).join('')}</div>
</div>`;
}
function detail(p, ctx) {
  const st = status(p, ctx); const s = repoStats(p, ctx);
  const repoBtn = isGitlab(p) ? 'View on GitLab ↗' : 'View on GitHub ↗';
  let main = '';
  main += p.shot ? `<div class="detail-shot">${shotImg(p, ctx, 'full', 'detail-img')}</div>` : `<div class="detail-shot">${ossCard(p, ctx, true)}</div>`;
  main += `<div class="detail-body">${(p.body || []).map(t => `<p>${esc(t)}</p>`).join('')}</div>`;
  if (p.diagram) {
    const d = (ctx.dims && ctx.dims[p.diagram]) || { width: 1212, height: 1214 };
    main += `<div class="arch-section"><div class="arch-label">architecture</div><img class="detail-diagram" src="${ctx.asset(`project/assets/img/${p.diagram}.webp`)}" width="${d.width}" height="${d.height}" alt="${esc(p.name)} architecture diagram" loading="lazy" decoding="async"></div>`;
  }
  if (p.helpIssues && p.helpIssues.length) {
    main += `<div class="issues-section"><div class="issues-label">good first issues</div><div class="issues-list">${p.helpIssues.map(i => ext(i.url, 'issue-link', `<span class="issue-spark">◇</span>${esc(i.t)}<span class="issue-open">open ↗</span>`)).join('')}</div></div>`;
  }
  main += related(p, ctx);

  let actions = '';
  if (p.live) actions += ext(p.live, 'meta-btn-live', 'Open live app ↗');
  if (p.repo) actions += ext(p.repo, 'meta-btn-repo', esc(repoBtn));
  if (p.issues) actions += ext(p.issues, 'meta-btn-issues', 'Browse issues');
  if (p.video) actions += ext(p.video, 'meta-btn-issues', '▶ YouTube playlist');
  if (p.cotw) actions += ext(p.cotw, 'meta-btn-issues', '★ Crate of the week — TWiR #560');

  let statsHtml = '';
  if (s && (typeof s.stars === 'number')) {
    const rows = [['★', fmtNum(s.stars), 'stars']];
    if (typeof s.forks === 'number') rows.push(['⑂', fmtNum(s.forks), 'forks']);
    if (typeof s.openIssues === 'number') rows.push(['◇', fmtNum(s.openIssues), 'open issues']);
    const pushed = monthYear(s.pushedAt); if (pushed) rows.push(['↻', pushed, 'last push']);
    statsHtml = `<div class="meta-divider"></div><div class="meta-section-label">on github</div><div class="repo-stats">${rows.map(r => `<div class="repo-stat"><span class="repo-stat-num"><span class="repo-stat-ico">${r[0]}</span>${esc(r[1])}</span><span class="repo-stat-lbl">${r[2]}</span></div>`).join('')}</div>`;
  }

  return `<div class="detail-wrap">
  <a class="detail-back" href="/#projects">← back to projects</a>
  <div class="detail-title-row"><h1 class="detail-name">${esc(p.name)}</h1><span class="detail-status ${st.cls}">${esc(st.long)}</span></div>
  <p class="detail-blurb">${esc(p.blurb)}</p>
  <div class="detail-grid">
    <div>${main}</div>
    <aside class="meta-panel">
      <div class="meta-actions">${actions}</div>
      ${statsHtml}
      <div class="meta-divider"></div>
      <div class="meta-section-label">stack</div>
      <div class="meta-tags">${(p.tech || []).map(t => `<span class="meta-tag">${esc(t)}</span>`).join('')}</div>
      <div class="meta-divider"></div>
      ${ext(D.DISCORD, 'meta-discord', '<span class="spark-dot"></span> Discuss on Discord →')}
    </aside>
  </div>
</div>`;
}

// ── Experiments ────────────────────────────────────────
function experiments() {
  return `<div class="exp-wrap">
  <div class="exp-super">// help wanted</div>
  <h1 class="exp-title">Experiments &amp; open ideas</h1>
  <p class="exp-sub">Our running backlog of ${D.EXPERIMENTS.length} experiments — agent tooling, security, filesystems and more. Some already have people building on them; many have no contributors yet — you could be the first. Say hi on Discord.</p>
  <div class="exp-btns">${ext(D.DISCORD, 'btn-accent', 'Start one on Discord →')}${ext('https://github.com/xoriors/experimental', 'btn-outline', 'experimental repo ↗')}</div>
  <div class="exp-grid">${D.EXPERIMENTS.map(x => {
    const label = x.url && x.url.indexOf('/issues/') > -1 ? 'View issue ↗' : (x.url ? 'View on GitHub ↗' : '');
    return `<div class="exp-card${x.url ? ' has-link' : ''}">
    <div class="exp-card-top"><h2 class="exp-card-title">${x.url ? `<a class="exp-card-stretch" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>` : esc(x.title)}</h2><span class="exp-tag">${esc(x.tag)}</span></div>
    <p class="exp-desc">${esc(x.desc)}</p>
    <div class="exp-card-foot"><span>${x.url ? ext(x.url, 'exp-issue-link', '◇ ' + esc(label)) : ''}</span>${ext(D.DISCORD, 'exp-discuss', 'Discuss →')}</div>
  </div>`;
  }).join('')}</div>
</div>`;
}

// ── About ──────────────────────────────────────────────
function contactGrid(list) {
  return `<div class="about-contact-grid">${list.map(c => {
    const mail = c.url.indexOf('mailto:') === 0;
    return `<a class="about-contact" href="${esc(safeUrl(c.url))}"${mail ? '' : ' target="_blank" rel="noopener noreferrer"'}><span class="about-contact-label">${esc(c.label)}</span><span class="about-contact-sub">${esc(c.sub)}</span><span class="about-contact-arrow">↗</span></a>`;
  }).join('')}</div>`;
}
function linkList(list, verb) {
  return `<div class="issues-list">${list.map(x => ext(x.url, 'issue-link', `<span class="issue-spark">◇</span>${esc(x.t)}<span class="issue-open">${verb} ↗</span>`)).join('')}</div>`;
}
const _unusedLangColors = { Rust: '#dea584', Python: '#3572A5', Shell: '#89e051', Kotlin: '#A97BFF', Java: '#b07219', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#663399', Go: '#00ADD8', 'C++': '#f34b7d', C: '#555555', Dockerfile: '#384d54', Ruby: '#701516', Dart: '#00B4AB', Swift: '#F05138' };
function githubCards() {
  // Filled in the browser by app.js from the GitHub API (see loadGithubCards);
  // the streak widget is the one hosted card that renders reliably.
  const fallback = `<div class="gh-fallback">${ext(D.SITE.founderGithub, 'lnk', 'view on GitHub ↗')}</div>`;
  return `<div class="gh-stats">
  <div class="gh-card" id="gh-stats-card"><div class="gh-card-title">github — radumarias</div>${fallback}</div>
  <img class="gh-streak" src="https://github-readme-streak-stats.herokuapp.com/?user=radumarias&amp;theme=vue-dark&amp;hide_border=true" width="495" height="195" alt="GitHub contribution streak" loading="lazy" decoding="async">
  <div class="gh-card" id="gh-langs-card"><div class="gh-card-title">top languages</div>${fallback}</div>
</div>`;
}
function about(ctx) {
  const lnk = (href, label, external) => external ? ext(href, 'lnk', label) : `<a href="${esc(href)}" class="lnk">${label}</a>`;
  return `<div class="about-wrap">
  <div class="about-super">// about xorio</div>
  <h1 class="about-title">Software craftsmanship taken to perfection.</h1>
  <p class="about-sub">Xorio is a Rust &amp; STEM open-source collective. We craft innovative solutions in Rust and other safe languages — Kotlin, Go, Python, Flutter and Java — with collaboration and transparency at the core, focused on high-performance systems, robust web services and secure applications.</p>

  <div class="about-section"><div class="about-section-label">what we do</div>
    <div class="about-grid">${D.ABOUT_SERVICES.map(s => `<div class="about-card"><h2 class="about-card-title">${esc(s.t)}</h2><p class="about-card-desc">${esc(s.d)}</p></div>`).join('')}</div>
  </div>

  <div class="about-section"><div class="about-section-label">flagship work</div>
    <div class="about-body"><p>Our best-known project is ${lnk('/p/rencfs', 'rencfs')} — an encrypted filesystem that mounts with FUSE, named Rust ${lnk('https://this-week-in-rust.org/blog/2024/08/14/this-week-in-rust-560/#crate-of-the-week', '<em>crate of the week</em>', true)} in August 2024. Around it grew a whole family: SyncOxiders for cloud file sync and encryption, rfs for distributed filesystems, desktop and daemon frontends, Python bindings and more — ${approx(D.PROJECTS.length)} projects, all listed in the ${lnk('/#projects', 'gallery')}.</p></div>
  </div>

  <div class="about-section"><div class="about-section-label">grow — learning &amp; community</div>
    <div class="about-grid-3">
      <div class="about-card"><h2 class="about-card-title">Learn</h2><p class="about-card-desc">We organize several free and open-source courses because we want to be the mentors we didn't have — it's also one way we give back to the community. Join ${lnk(D.DISCORD, 'Discord', true)} and choose the courses you're interested in — details in the ${lnk('https://discord.com/channels/1323612358689427507/1324456230944641054', '#courses', true)} channel.</p></div>
      <div class="about-card"><h2 class="about-card-title">Mentor</h2><p class="about-card-desc">If you want to be a mentor and help others grow, you're among the right people. Join ${lnk(D.DISCORD, 'Discord', true)} — the ${lnk('https://discord.com/channels/1323612358689427507/1324460993434226708', '#i-am-a-mentor', true)} channel explains how to get started.</p></div>
      <div class="about-card"><h2 class="about-card-title">Talks &amp; coding challenges</h2><p class="about-card-desc">Periodic in-person and online talks and coding challenges keep you up to date with the latest tech and sharpen problem-solving. Announced in channels like <strong>#coding-challenge</strong>; events are organized on ${lnk('https://www.meetup.com/star-tech-rd-reloaded', 'Meetup', true)} (Star Tech RD Reloaded).</p></div>
    </div>
    <div class="about-body mt16"><p>Many of our ${lnk('/experiments', 'experiments')} have no contributors yet — you could be the first. If you want to ship a feature, mentor, or just learn in the open, there's a seat for you.</p></div>
  </div>

  <div class="about-section"><div class="about-section-label">stack — join us and work with</div>
    ${D.ABOUT_STACK.map(g => `<div class="about-stack-group"><div class="about-stack-label">${esc(g.group)}</div><div class="about-tags">${g.items.map(t => `<span class="meta-tag">${esc(t)}</span>`).join('')}</div></div>`).join('')}
  </div>

  <div class="about-section"><div class="about-section-label">founder</div>
    <div class="about-founder"><span class="about-founder-glyph">RM</span><div><div class="about-founder-name">Radu Marias</div><div class="about-founder-sub">Founder &amp; visionary — among Romania's most active GitHub users, with deep contributions across the Rust ecosystem.</div></div>${ext(D.SITE.founderGithub, 'about-founder-link', 'GitHub ↗')}</div>
    <p class="gh-claim">In 2024, Radu was the <span class="hl">5th most active GitHub user in Romania</span> — and the first for Rust language.</p>
    ${githubCards(ctx)}
    <div class="about-doc-btns">${ext('/project/docs/Radu_Marias_Resume.pdf', 'btn-outline', 'Resume ↗')}${ext('/project/docs/cover-letter.pdf', 'btn-outline', 'Cover letter ↗')}</div>
    <div class="about-body mt16"><p>Interested in contributing to open source? Discover the steps to get involved on the ${lnk('/contribute', 'contribute page')}.</p></div>
  </div>

  <div class="about-section"><div class="about-section-label">articles</div>${linkList(D.ABOUT_WRITING.articles, 'read')}</div>
  <div class="about-section"><div class="about-section-label">slides</div>${linkList(D.ABOUT_WRITING.slides, 'view')}</div>
  <div class="about-section"><div class="about-section-label">talks</div>${linkList(D.ABOUT_WRITING.talks, 'watch')}</div>

  <div class="about-section"><div class="about-section-label">get in touch — xorio community</div>${contactGrid(D.ABOUT_CONTACTS_XORIO)}
    <div class="about-section-label mt26">radu marias — personal</div>${contactGrid(D.ABOUT_CONTACTS_PERSONAL)}
  </div>
</div>`;
}

// ── Contribute ─────────────────────────────────────────
function contribute(ctx) {
  const issues = [];
  D.PROJECTS.forEach(p => (p.helpIssues || []).forEach(i => issues.push({ p, i })));
  return `<div class="contrib-wrap">
  <div class="contrib-super">// get in touch</div>
  <h1 class="contrib-title">Build with the collective.</h1>
  <p class="contrib-sub">We're a Rust &amp; STEM open-source collective — software craftsmanship taken to perfection. Whether you want to ship a feature, mentor, or just learn in the open, there's a seat for you.</p>
  <div class="about-section-label">how it works</div>
  <ol class="steps">${D.CONTRIBUTE_STEPS.map((s, i) => `<li class="step"><span class="step-num">${i + 1}</span><div><div class="step-title">${esc(s.t)}</div><div class="step-desc">${esc(s.d)}</div></div></li>`).join('')}</ol>
  <div class="about-section-label mt26">channels</div>
  <div class="contact-grid">${D.CONTACT.map(c => {
    const mail = c.url.indexOf('mailto:') === 0;
    return `<a href="${esc(safeUrl(c.url))}"${mail ? '' : ' target="_blank" rel="noopener noreferrer"'} class="contact-card"><span class="contact-glyph">${esc(c.glyph)}</span><div><div class="contact-label">${esc(c.label)}</div><div class="contact-sub">${esc(c.sub)}</div></div><span class="contact-arrow">↗</span></a>`;
  }).join('')}</div>
  ${issues.length ? `<div class="about-section-label mt26">good first issues</div><div class="issues-list">${issues.map(({ p, i }) => ext(i.url, 'issue-link', `<span class="issue-spark">◇</span><span class="issue-proj">${esc(p.name)}</span>${esc(i.t)}<span class="issue-open">open ↗</span>`)).join('')}</div>` : ''}
  <div class="about-body mt16"><p>Looking for something bigger? The <a class="lnk" href="/experiments">experiments backlog</a> has ${D.EXPERIMENTS.length} ideas waiting for an owner. The full contact directory — Slack workspaces, Meetup, personal profiles — is on the <a class="lnk" href="/about">about page</a>.</p></div>
</div>`;
}

function notFound() {
  return `<div class="contrib-wrap nf-wrap">
  <div class="contrib-super">// 404</div>
  <h1 class="contrib-title">Nothing mounted at this path.</h1>
  <p class="contrib-sub">The page you asked for doesn't exist (or moved). Try the project gallery, or open the terminal on the home page and type <code>ls</code>.</p>
  <div class="exp-btns"><a class="btn-accent" href="/">Home</a><a class="btn-outline" href="/#projects">Browse projects</a></div>
</div>`;
}

module.exports = { esc, safeUrl, counts, approx, repoKey, filterHref, home, detail, experiments, about, contribute, notFound, status };
