#!/usr/bin/env node
/*
 * Refreshes project/data/stats.json from the GitHub API:
 *   - stars / forks / open issues / last push for every GitHub repo in src/data.js
 *   - profile numbers and language mix for the founder account
 *
 * Runs nightly in .github/workflows/stats.yml. Set GITHUB_TOKEN to avoid the
 * anonymous rate limit (60 requests/hour); the workflow's default token is
 * enough. Failures leave the previous file untouched.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('../src/data');

const OUT = path.join(__dirname, '..', 'project', 'data', 'stats.json');
const USER = 'radumarias';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'xorio-website-stats', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) };

async function get(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
function repoKey(p) { const m = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?$/.exec(p.repo || ''); return m ? `${m[1]}/${m[2]}` : null; }

(async () => {
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const out = { generatedAt: new Date().toISOString(), note: prev.note || 'Refreshed by .github/workflows/stats.yml (npm run stats).', user: {}, repos: {} };

  const keys = [...new Set(D.PROJECTS.map(repoKey).filter(Boolean))];
  for (const k of keys) {
    try {
      const r = await get(`https://api.github.com/repos/${k}`);
      out.repos[k] = { stars: r.stargazers_count, forks: r.forks_count, openIssues: r.open_issues_count, pushedAt: r.pushed_at };
      console.log('repo', k, out.repos[k].stars + '★');
    } catch (e) {
      console.warn('skip', k, e.message);
      if (prev.repos && prev.repos[k]) out.repos[k] = prev.repos[k];
    }
  }

  try {
    const u = await get(`https://api.github.com/users/${USER}`);
    let repos = [];
    for (let page = 1; page <= 10; page++) {
      const batch = await get(`https://api.github.com/users/${USER}/repos?per_page=100&page=${page}&type=owner`);
      repos = repos.concat(batch);
      if (batch.length < 100) break;
    }
    repos = repos.filter(r => !r.fork);
    const counts = {};
    repos.forEach(r => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
    out.user = {
      login: USER, followers: u.followers, publicRepos: u.public_repos,
      totalStars: repos.reduce((a, r) => a + r.stargazers_count, 0),
      totalForks: repos.reduce((a, r) => a + r.forks_count, 0),
      contributionsLastYear: null,
      langs: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
    };
    console.log('user', USER, out.user.followers, 'followers,', out.user.totalStars, 'stars');
  } catch (e) {
    console.warn('user stats failed:', e.message);
    out.user = prev.user || { login: USER, langs: [] };
  }

  // Contributions need GraphQL (and a token). Optional.
  if (TOKEN) {
    try {
      const q = { query: `{ user(login:"${USER}") { contributionsCollection { contributionCalendar { totalContributions } } } }` };
      const r = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
      const j = await r.json();
      const n = j && j.data && j.data.user && j.data.user.contributionsCollection.contributionCalendar.totalContributions;
      if (typeof n === 'number') { out.user.contributionsLastYear = n; console.log('contributions', n); }
    } catch (e) { console.warn('graphql failed:', e.message); }
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
  console.log('wrote', path.relative(process.cwd(), OUT));
})().catch(e => { console.error(e); process.exit(1); });
