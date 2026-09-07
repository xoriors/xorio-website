# xorio.rs

Source of [xorio.rs](https://xorio.rs) — the project showcase of the xorio open-source collective.
Plain static HTML, no framework: a small Node build script turns `src/` into finished pages that Vercel serves as-is.

## Layout

| Path | What |
|---|---|
| `src/data.js` | **All content** — projects, groups, filters, experiments, contacts, About copy. Edit this. |
| `src/render.js` | HTML templates (pure functions, build-time only). |
| `src/shell.html` | Page shell: `<head>`, nav, footer. `{{a:path}}` tokens become cache-busted asset URLs. |
| `src/styles.css` | The stylesheet (self-hosted fonts, light/dark themes, responsive rules). |
| `src/app.js` | Browser JS: theme switch, gallery filter/search, the hero terminal, legacy `#hash` redirects. |
| `src/theme.js` | Tiny pre-paint script that applies the saved/OS theme without a flash. |
| `src/privacy.html` | Body of the privacy policy. |
| `src/shots/` | Source screenshots (PNG). Files starting with `_` are art sources for the CSS-rendered repo cards. |
| `project/assets/img/` | Optimised images generated from `src/shots/` (`npm run images`). |
| `project/assets/fonts/` | Self-hosted Space Grotesk, IBM Plex Sans, JetBrains Mono (latin, variable). |
| `project/data/stats.json` | Hand-maintained ★ counts for cards and project pages. |
| `project/docs/` | PDFs linked from the About page. |
| `build.js` | Generates `index.html`, `f/<key>.html`, `p/<id>.html`, `about.html`, `experiments.html`, `contribute.html`, `privacy.html`, `404.html`, `sitemap.xml`, `robots.txt` and copies CSS/JS into `project/assets/`. |
| `tools/` | `images.js` (sharp pipeline), `serve.js` (local preview with Vercel-style clean URLs). |
| `design/` | The original Claude Design handoff bundle (prototypes, chat transcript, brand sources). Not deployed. |
| `vercel.json` | Clean URLs, immutable caching for `/project/assets`, security headers and CSP. |

Generated pages are committed so the deploy needs no build step. `.vercelignore` keeps `src/`, `tools/`, `design/` and tooling out of the deployment.

## Editing content

1. Change `src/data.js` (add a project, fix a blurb, add an experiment…).
2. If you added a screenshot, drop `src/shots/<id>.png` (1280 px wide is plenty) and set `shot:'<id>'` on the project. Repositories without a screenshot get a CSS-rendered card automatically; set `art:'<name>'` to decorate it with `project/assets/img/art-<name>.webp`.
3. Run:

```sh
npm install        # only needed for `npm run images` (sharp)
npm run images     # only if screenshots changed
npm run build      # regenerates every page
npm run serve      # http://localhost:8000 with the same routing as Vercel
```

4. Commit everything, including the regenerated HTML. If you forget the build, the `Build site` workflow regenerates and commits it on `main`.

## Star counts and GitHub numbers

`project/data/stats.json` holds the ★ counts shown on cards and the "on GitHub" panel of project pages; update the numbers by hand when you like. The founder cards on the About page (stars, followers, repos, top languages) are fetched **in the browser** from the GitHub API and cached for a day per visitor — no build step, no bot commits, always current. The contribution-streak card is the hosted widget from github-readme-streak-stats.

## URLs

Every page has a real path (`/p/rencfs`, `/about`, …) with its own title, description and social-preview image (`project/assets/img/<shot>-og.jpg`, or `project/assets/og.jpg`). Gallery filters are real pages too (`/f/oss`, `/f/ai`, …), prerendered with the filter applied and switched in place by `app.js`; the "All" chip is `/`. The old `#p/<id>`, `#f/<key>` and `#about` hash links redirect client-side.

## Known gaps

- **Ice Cube Simulator** has no public live URL yet; the card links to its source until it is deployed like the other apps. Add `live:` in `src/data.js` once it is.
- The contributing guide link points at `xoriors/rencfs`. An org-level `xoriors/.github` repository with a `CONTRIBUTING.md` would cover every project — update `SITE.contributing` when it exists.
