# PARITY.md - docs-compiler SSG vs production (Phase C root-flip package)

Status: **flip-ready, one decision left** (route mapping). Evidence below was
collected live on 2026-11-20 from `wyattau.github.io/solid-fx/` (production,
astro + Starlight chrome) and `wyattau.github.io/solid-fx/preview/` (SSG,
docs-compiler 0.7.6). Engine fixes landed during this audit are listed in
section 6.

## 1. Verdict

The preview meets or beats production on every surface except URL shape.
The blocker for the flip is not capability - it is the **route-space
mismatch** (section 3): production serves kebab-case directories
(`/animations/animated-content/`), the SSG serves the generated tree
(`/preview/content/Animations/animated-content.html`). Options A/B in
section 4. Everything else is green: chrome, search, SEO surfaces, 404,
theme, mobile QA (3 phones incl. a 2016 Android 8 floor device).

## 2. Inventory

| Surface            | Production (astro)            | SSG preview (docs-compiler 0.7.6)      |
|--------------------|-------------------------------|----------------------------------------|
| Pages              | 439 (sitemap-0.xml)           | 470 (sitemap.xml)                      |
| Catalog coverage   | 436 entries (76/128/96/70/66) | same catalog, + per-category indexes   |
| Sidebar nav        | Starlight                     | docs-compiler nav groups               |
| TOC / pager        | Starlight                     | yes (+ breadcrumbs)                    |
| Theme toggle       | Starlight                     | yes (persisted, no-flash)              |
| Search             | **none**                      | DocSearch island + search.json (470)   |
| FST binary index   | n/a                           | search.bin (reader-ready, ABI 0.3.1)   |
| atom feed          | 404                           | yes                                    |
| robots.txt         | 404                           | yes (AI-crawler policy recorded)       |
| llms.txt           | yes                           | yes                                    |
| sitemap            | index + 439                   | yes, 470, single file                  |
| styled 404         | yes                           | yes                                    |
| canonical/og:url   | astro                         | yes, base-path-joined (0.7.6)          |
| accent theming     | fixed                         | `site.toml accent` (sky #38bdf8)       |
| Determinism        | astro hashes                  | byte-stable, precompressed sidecars    |

Island demos: both sites ship the interactive components; the preview
copies `dist-islands` into `_assets/islands` and mounts them through
`<docs-island>` (verified live on-device in the Phase C QA pass).

## 3. The one gap: route space

- Production: `/solid-fx/animations/animated-content/` (kebab, dir, slash)
- SSG: `/solid-fx/preview/content/Animations/animated-content.html`
  (`/content/<Category>/<Page>.html`, CamelCase categories)

Any external link, bookmark, or search-engine entry pointing at the
production URLs must survive the flip. Two options:

- **Option A (recommended): redirect map.** Keep the SSG routes, emit a
  `_redirects`/JS-meta-refresh map from the 439 production routes onto
  the SSG routes. The mapping is mechanical (kebab-name -> generated
  page name); `build-islands.mjs` already knows both names at generation
  time and can emit the table deterministically.
- **Option B: route re-shaping in the compiler.** Teach docs-compiler a
  `route_template` (slugify dirs, strip suffixes) so the SSG natively
  serves `/animations/animated-content/`. Larger engine change; only
  worth it if clean URLs are a product requirement.

## 4. Flip plan (deploy-docs.yml)

Current graph: `build` (astro) + `build-preview-ssg` -> `merge-and-upload`
(astro-dist at root, ssg-preview under `preview/`) -> `deploy`.

Flip = swap the merge layout:

1. `build-preview-ssg` keeps its step list (pin `--version 0.7.6`),
   plus Option A's redirect map emission if chosen.
2. `merge-and-upload` inverts the paths: `ssg-preview` artifact to
   `merged/`, `astro-dist` to `merged/legacy/` (kept for one release
   cycle as redirect fallback when Option A is chosen; dropped when B).
3. Comment out the astro `build` job's `needs` edge if build time
   matters; the astro artifact is then only produced by the nightly.
4. `deploy` stays `needs: merge-and-upload` - no environment change,
   no Pages setting change.

Rollback: revert the single workflow commit; production is re-deployed
from the astro root on the next push (Pages keeps no state that
matters). Estimated flip risk: low; blast radius: one push.

## 5. Acceptance criteria for the flip

1. `https://wyattau.github.io/solid-fx/` serves the SSG shell (brand,
   sidebar, accent) with a 200.
2. Spot-check one page per category renders its island demo.
3. `search.json` + `search.bin` resolve under the new root; a query
   returns results in the island.
4. canonical/og:url/sitemap/atom/llms.txt/robots all carry the
   production origin with no `/preview/` segment (`--base-path` drops
   to `/solid-fx`).
5. Redirect map (if Option A): all 439 legacy routes resolve via
   redirect, none 404.
6. Mobile spot-check on one small screen (S7 floor device preferred).

## 6. Engine fixes landed during this audit (docs-compiler 0.7.5/0.7.6)

- `site.toml accent` (#rgb/#rrggbb) themes the chrome palette; adopted
  on all three tenants (portal violet, canon emerald, preview sky).
- Absolute URLs (canonical, og:url, JSON-LD isPartOf, feed link,
  llms.txt, sitemap loc, robots, atom) join `base_path` via
  `SiteConfig::full_url` - subpath hosts no longer emit localhost or
  bare-origin canonicals.
- Tenant generators fixed to emit the Pages origin: portal
  `portal.toml` -> `gen_pages.py` passthrough (+accent), solid-fx
  `build-islands.mjs` hardcoded localhost replaced.
- pattern-standards canon was serving **unstyled** live (root-relative
  `/_assets/` 404 under the project subpath): its build now passes
  `--base-path /pattern-standards` and the deployed site is fixed and
  verified.
