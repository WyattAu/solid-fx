# EXTRAS-ROADMAP.md — non-react-bits sources, prioritized

Companion to `LICENSE-SOURCES.md` (license verdicts) and `PORTING.md` (law).
Everything here targets `src/extras/<source>/<Category>/<Name>/<Name>.tsx` per
LICENSE-SOURCES.md rule 2. Verified 2026-11-06; backlog candidates license-vetted
2026-11-07; new candidates (Lenis, Paper Shaders, gradient-gl, daisyUI, Originkit,
Spline, Framer, casberry) vetted 2026-11-12; shader sweep + iamtechartist
(gl-transitions, curtains.js, LYGIA) vetted 2026-11-13.

## Priority 1 — anime.js v4 engine adoption (pilot)

**Status: license-vetted (MIT), not yet integrated.** npm `animejs` 4.5.0.

- Repo: https://github.com/juliangarnier/anime (default branch `master`;
  `LICENSE.md` verified MIT © 2025 Julian Garnier; GitHub API spdx `MIT`).
- Why this engine: v4 is vanilla, framework-agnostic ES modules — no React
  bindings to strip, unlike `motion/react` ports. 74.3k★, actively maintained
  (pushed 2026-11). Overlaps GSAP/motion for tweens but is the lightest
  per-component dependency for timeline/SVG/stagger work.
- Verified v4 public API (from `animejs@4.5.0` `dist/modules/index.d.ts` and
  README): root exports `animate`, `createTimeline`, `createTimer`,
  `createScope`, `createDraggable`, `stagger`, plus namespace modules
  `animejs/svg`, `animejs/utils`, `animejs/text`, `animejs/easings`,
  `animejs/waapi`. Subpath imports keep bundles small.
- Cleanup mapping (PORTING.md §4 discipline): `animate()`/`createTimeline()`
  return `JSAnimation`/`Timeline` instances with `.revert()` — the anime.js
  equivalent of `gsap.context().revert()`. Pattern:
  `onMount(() => { const tl = createTimeline({...}); onCleanup(() => tl.revert()); })`.
  Never leave a v4 animation without `.revert()` (or `.cancel()`) in `onCleanup`.

### Pilot demos (one dir each, src/extras/animejs/Pilots/)

| # | Component | anime.js v4 API | Concept |
| - | --------- | --------------- | ------- |
| 1 | `TimelineTextReveal` | `createTimeline({ defaults: { ease } })` + `.add()` chaining + `stagger(30, { from: 'first' })` over per-char spans | Line-by-line text reveal; chars fade/slide in sequence, timeline loops on a trigger |
| 2 | `SvgLineDrawLogo` | `import { createDrawable } from 'animejs/svg'`; `animate(drawables, { draw: '0 1', duration, delay: stagger(250) })` | Logo strokes draw themselves in (`draw` from 0→1), then hold |
| 3 | `StaggerChoreo` | `stagger(65, { grid: [7, 7], from: 'center', ease: 'inOutQuad' })` as `delay` inside one `animate()` over a grid of dots | Center-out ripple choreography on hover/loop |

Each pilot keeps the standard `<Name>Demo.tsx` harness so `bun run gen:docs`
picks it up automatically (add `animejs` to the `EXTRAS` array in
`scripts/gen-docs.mjs`; the Astro sidebar already autogenerates `extras/`).

### Wiring checklist for the pilot

1. `bun add animejs` — single runtime dep for all three pilots.
2. LICENSE-SOURCES.md: flip anime.js Status to `Ported (n) — src/extras/animejs/`.
3. LICENSE.md NOTICE: append anime.js attribution (MIT © 2025 Julian Garnier,
   https://github.com/juliangarnier/anime) per LICENSE-SOURCES.md rule 5.
4. `scripts/gen-docs.mjs`: add `{ source: 'animejs', label: 'anime.js' }` to the
   `EXTRAS` array (and the unused `EXTRAS_SOURCES` const or delete it).
5. PORTING.md §1: apply the allowed-imports edit below **before** the first port.
6. Provenance header in each pilot file: `// Source: https://github.com/juliangarnier/anime@<sha-or-v4.5.0>. License: MIT.` (rule 3).

## Priority 2 — tsParticles backgrounds

**Status: license-vetted (MIT), not started.**

- Repo: https://github.com/tsparticles/tsparticles (canonical org repo;
  `matteobruni/tsparticles` redirects there). `LICENSE` verified MIT © 2020
  Matteo Bruni. Homepage https://particles.js.org.
- Engine packages (v3 line): `@tsparticles/engine` + one bundle
  (`@tsparticles/slim` or `@tsparticles/all`). An official Solid adapter exists,
  but we skip adapters — init/load in `onMount`, `container.destroy()` in
  `onCleanup`, matching the repo's vanilla-first contract.
- Picks: port two Magic-UI-style background components onto the engine under
  `src/extras/tsparticles/Backgrounds/`: `Particles` (interactive particle
  field; react-bits has no equivalent) and `Confetti` (burst on trigger).
- Wiring: same checklist as the anime.js pilot, plus `@tsparticles/engine` +
  bundle in PORTING.md §1.

## Priority 3 — Magic UI completion

**Status: approved (MIT), 3 of many ported** — `src/extras/magic-ui/Ui/`
(BorderBeam, DotPattern, Marquee); docs + sidebar already wired and verified
(3 pages under `docs/extras/magic-ui/ui/`).

Next picks (animation-relevant, in order): `AnimatedBeam`,
`ShimmerButton`, `FlickeringGrid`, `Asterisk`. Same tree
(`src/extras/magic-ui/Ui/<Name>/`), no new deps beyond what Magic UI upstream
uses (`motion`, already allowed).

## Priority 4 — Kibo UI (deferred)

**Status: approved (MIT), no picks yet.** Verified repo is
https://github.com/shadcnblocks/kibo (`kibo-ui/kibo` and `kibo-ui/kibo-ui` are
404; shadcnblocks acquired Kibo UI in Oct 2025; `license.md` MIT © 2023–present
shadcnblocks). It is a functional shadcn registry (tables, file upload, AI
chat) — low overlap with solid-fx's animation focus. Revisit only for a
specific functional need; any pick still lands under `src/extras/kibo/`.

## Backlog 1 — Motion Primitives (recommended next source)

**Status: license-vetted (MIT), not started.** Highest animation density per
component of the new candidates; `motion` is already an allowed dep, so no new
runtime dependencies.

- Repo: https://github.com/ibelick/motion-primitives (6.8k★, beta, actively
  maintained). `LICENCE.md` (note British spelling) verified MIT © 2024 ibelick;
  GitHub API spdx `MIT`. 39 components.
- Dependency layer: components are React + `motion/react` + Tailwind. The
  `motion/react` shell (`AnimatePresence`, `useInView`) is the only React-coupled
  part — ports re-target vanilla `motion` exactly like the existing react-bits
  motion ports; in-view logic goes to `IntersectionObserver` (lift to `src/lib`
  if shared). Cost: low — same translation pattern as `src/content`.
- Picks (first wave): `Text Scramble`, `Text Shimmer` + `Text Shimmer Wave`,
  `Spinning Text`. Second wave: `Magnetic`, `Spotlight`, `Glow Effect`,
  `Border Trail`, `Progressive Blur`, `Infinite Slider`.
- Overlap check before porting (rule 4): `Text Shimmer` vs react-bits
  `Shiny Text`; `Border Trail` vs Magic UI `BorderBeam`. Keep the faithful
  port, alias the other.

## Backlog 2 — Animata (most vanilla-friendly)

**Status: license-vetted (MIT), not started.**

- Repo: https://github.com/codse/animata (3k★; site https://animata.design).
  `LICENSE.md` verified MIT © Animata; GitHub API spdx `MIT`. 157+ components
  across 19 categories (text, buttons, preloader, scroll, skeletons, hero).
- Dependency layer: most components are Tailwind classes + React state — the
  most vanilla-friendly source in this backlog. `motion`/`framer-motion`
  imports are optional and component-scoped; lucide icons swap for the
  existing `@/lib/HugeiconsIcon` layer. Port the CSS-only components first
  (near-zero cost), `motion`-based ones second.
- Picks (first wave): PreLoader `Split Reveal`, PreLoader `Vertical Tiles`,
  `Toggle Switch` (button/toggle-switch). Then sweep the pure-Tailwind
  text/hero categories. Registry JSON per component at
  `https://animata.design/r/<category>/<slug>.json` for provenance pins.

## Backlog 3 — Kokonut UI (distinct effects, moderate cost)

**Status: license-vetted (MIT), not started.**

- Repo: https://github.com/kokonut-labs/kokonutui (2.2k★, shadcn registry).
  `LICENSE` verified MIT © 2025 kokonutUI; GitHub API spdx `MIT`. 44 registry
  components in `components/kokonutui/` (the site's "100+" counts variants and
  Pro). Scope guard: Kokonut Pro is paid; `.agents/skills/frontend-design`
  (Apache-2.0) and `lib/og/fonts` are third-party-licensed — exclude both.
- Dependency layer: `motion` + shadcn/ui primitives (cn, lucide, Radix) —
  moderate React coupling. Background components are canvas/WebGL-based
  (vanilla-friendly after rewrite, three.js already allowed); buttons/nav lean
  on shadcn primitives that need full Solid rewrites (skip those first).
- Picks (first wave): `Split Flap Text`, `Typing Text`, `Halftone` (background).
  `Caustics` / `Dither Reveal Hero` only if the canvas layer ports cleanly.

## Backlog 4 — Origin UI / coss.com/ui (deferred)

**Status: Conditional (MIT with repo-scoping rules), not started.**

- Repo: https://github.com/cosscom/ui — canonical home; `origin-space/originui`
  redirects there after the Cal.com/coss.com acquisition. Root `LICENSE` and
  `apps/origin/LICENSE.md` verified MIT ("© 2025 coss.com and Origin UI").
  ~600 legacy app-UI components in `apps/origin` (registry index at
  `apps/origin/registry.json`). **Never source from `cosscom/coss`** — that is
  the separate AGPL-3.0 coss.com product repo.
- Dependency layer: React + Radix + react-aria + Tailwind v4 — every Radix
  primitive needs a Solid rewrite, so per-component cost is higher than
  Backlogs 1–3. Effects density is low (app UI: inputs, selects, tables,
  steppers); port on functional need only, provenance-pinned to `apps/origin`.

## Backlog 5 — HyperUI (deferred)

**Status: license-vetted (MIT), not started.**

- Repo: https://github.com/markmead/hyperui (12.2k★, Astro docs site,
  pushed 2026-10). `LICENSE` verified MIT © Mark Mead; GitHub API spdx `MIT`.
  Hundreds of HTML + Tailwind v4 blocks (marketing, ecommerce, application UI).
- Dependency layer: HTML-first — components are class strings, so ports are
  the cheapest possible (no React layer to strip, zero new deps), but the
  effects subset is small (hover transitions, marquees, animated stats).
  Pick on docs-site need, not as a bulk source.

## New candidates (vetted 2026-11-12)

### Lenis — smooth scroll engine (recommended next engine)

**Status: license-vetted (MIT), not started.**

- Repo: https://github.com/darkroomengineering/lenis (17.2k★, pushed 2026-11 —
  very active). `LICENSE` verified MIT © 2024 darkroom.engineering; npm `lenis`
  1.3.27 ships `license: MIT`.
- Engine layer: vanilla, framework-agnostic (own rAF loop + virtual scroll).
  Official wrappers exist for React/Vue/Svelte/Astro but **no Solid adapter —
  skip wrappers entirely**: instantiate in `onMount`, drive `lenis.raf(time)`
  in the component's rAF loop, `onCleanup(() => lenis.destroy())`. Lenis owns
  the document scroll, so a missing destroy is worse than a leaked tween —
  never leave one alive. Single zero-dependency runtime package.
- Picks (first wave, `src/extras/lenis/`): `SmoothScroll` (page-level
  smooth-scroll wrapper), `StackingCards` (sticky scroll stack),
  `ParallaxLayers` (depth-on-scroll). Overlap check (rule 4) before porting:
  react-bits `ScrollFloat`/`ScrollVelocity`/`ScrollReveal` are native-scroll
  text effects — lenis adds virtual smoothing, no direct dupes.
- Wiring: same checklist as the anime.js pilot — add `lenis` to PORTING.md §1
  and `{ source: 'lenis', label: 'Lenis' }` to the gen-docs `EXTRAS` array
  when the first port lands.

### Paper Shaders — shader background source (ShaderGradient replacement)

**Status: license-vetted (Apache-2.0 — NOT MIT), not started.**

- Repo: https://github.com/paper-design/shaders (3.9k★, pushed 2026-11).
  Root `LICENSE` verified Apache-2.0; npm `@paper-design/shaders` /
  `@paper-design/shaders-react` 0.0.82 both `license: Apache-2.0`. Docs:
  https://shaders.paper.design.
- The candidate the ShaderGradient exclusion pointed to: zero-dependency
  canvas shader backgrounds with a **framework-agnostic vanilla core**
  (`@paper-design/shaders`). Skip `shaders-react`. README examples are
  React-first — verify the vanilla API shape at shaders.paper.design before
  the first port.
- Two contract differences from the MIT sources: (1) Apache-2.0 → LICENSE.md
  NOTICE must carry the full attribution + license text reference per
  LICENSE-SOURCES.md rule 5, not the MIT one-liner; (2) upstream warns
  "pin your dependency — we will ship breaking changes under 0.0.x", so the
  PORTING.md §5 entry must pin an exact version, not a caret range.
- Picks (first wave, `src/extras/paper-shaders/Backgrounds/`):
  `MeshGradient`, `DotOrbit`, `Waves`.

### gradient-gl — micro source (optional)

**Status: license-vetted (MIT), not started.**

- https://github.com/metaory/gradient-gl (59★, pushed 2026-10). `LICENSE`
  verified MIT © 2025 metaory **at branch `master`** (`main` does not exist);
  npm `gradient-gl` 2.1.0 ships `license: MIT`.
- Tiny vanilla WebGL library for deterministic seed-driven procedural
  gradient animations — no React layer at all, ports are canvas + rAF +
  `onCleanup` only. Niche: pick on docs-site need, not as a bulk source.
  Lands under `src/extras/gradient-gl/`.

### daisyUI — Tailwind plugin, not a source

Verified MIT © 2020 Pouya Saadeghi (`LICENSE` at github.com/saadeghi/daisyui
branch `master`; npm `daisyui` 5.7.50 MIT; 42.8k★). 68 CSS-only components on
daisyui.com. There is no component code to port — it is a Tailwind plugin
whose class names work in any framework, Solid included, so it belongs as an
optional styling layer for demos rather than a tree in `src/extras/`. No
picks; listed in LICENSE-SOURCES.md as a dependency option only.

### Originkit — conditional, per-pick vetting

The only public repo, `vellum-ai/originkit` (31★, pushed 2026-07), is a
Vellum MCP importer plugin — MIT © 2026 Vellum, Inc. (`LICENSE` verified) —
that browses/fetches Originkit's 250+ animated components (React/Next/Vite/
Framer stacks) from originkit.dev. The component library itself has **no
published license and no public repo** (no `/license` page; only a "terms"
link). Treat exactly like 21st.dev: per-component provenance check before
any port, and the Vellum repo's MIT does **not** cover the components.
No picks until originkit.dev publishes terms.

## Shader sweep (vetted 2026-11-13)

### gl-transitions — GLSL transition shader collection (recommended next shader source)

**Status: license-vetted (MIT), not started.**

- Repo: https://github.com/gl-transitions/gl-transitions (2.2k★, pushed 2026-11 —
  very active). `LICENSE` verified MIT © 2017-present gl-transitions contributors.
  Note: the GitHub API flags the repo license "Other"/NOASSERTION — a detection
  quirk; the file text is standard MIT and governs.
- 217 GLSL transition shaders under `transitions/`, one file per effect
  (`CrossZoom`, `GridFlip`, `GlitchDisplace`, `Chessboard`, …). The repo grew into
  a multi-platform monorepo (npm packages, Rust, Android, Swift) — ignore all of
  it; the `.glsl` files are the only source.
- Port class identical to Paper Shaders: each shader is a
  `transition(vec2 uv, vec4 from, vec4 to, float progress)`-style function — render
  two images/texts to offscreen canvases, drive `progress` via rAF, dispose the
  WebGL context in `onCleanup`. No React layer to strip.
- Picks (first wave, `src/extras/gl-transitions/Transitions/`): `CrossZoom`,
  `GridFlip`, `GlitchDisplace`. Provenance pins the exact
  `transitions/<Name>.glsl` + commit (rule 3).

### curtains.js — vanilla WebGL DOM planes (optional, stale upstream)

**Status: license-vetted (MIT), not started.**

- Repo: https://github.com/martinlaxenaire/curtainsjs (1.8k★ — the username has
  **no hyphen**; `martin-laxenaire/curtainsjs` 404s). MIT verified (GitHub API
  spdx `MIT`); npm `curtainsjs` 8.1.6 ships `license: MIT`.
- Vanilla WebGL engine that turns existing DOM elements into shader-driven
  planes/textures (v8+ dropped its three.js dependency): image hover-distortion,
  slideshow transitions, scroll-bound planes. Framework-agnostic — mount in
  `onMount`, destroy the context in `onCleanup`.
- Caveat: upstream is stale (last push 2025-04). Fine as a niche source — pick on
  docs-site need, do not adopt it as a core engine. Lands under
  `src/extras/curtains/`.

## Excluded / unchanged

iamtechartist.com: **Excluded — portfolio, not a source** (vetted 2026-11-13).
The site is a WordPress blog/portfolio of standalone Three.js demo apps
("3D · interactive worlds · games · education"). The GitHub profile
github.com/iamtechartist holds ~30 such projects, most carrying MIT licenses per
the GitHub API (coastal-simulation 66★, ocean-simulation 46★) — but none is a
component library: each repo is a full scene/app with no registry, no component
surface, and third-party embedded assets (e.g. Meshy AI models). Nothing
portable to port; the MIT repos may be studied for techniques only.

LYGIA: **Excluded** (vetted 2026-11-13) — github.com/patriciogonzalezvivo/lygia
(3.5k★, active, pushed 2026-10) looks like the ideal shader-function library
(GLSL/HLSL/Metal/WGSL/CUDA), but `LICENSE.md` is the **Prosperity Public License
3.0.0**: free for non-commercial use, commercial use requires a paid license
after a 30-day trial. Non-commercial grant = same bucket as Codrops' restrictive
demos. Re-vet only on relicense.

Also swept and skipped (2026-11-13 GitHub shader-background search, top results):
`xemantic/shader-web-background` (GPL-3.0 — copyleft), `ebruneton/black_hole_shader`
(BSD-3, single-effect demo, outside the MIT/Apache/ISC bar), ShaderToyVid +
Shadertoy-derivative class (per-shader licensing, already excluded), `Azkun/balatroShader`
(no license), `idleCyrex/topolines` (GitHub "Other"), `wrennly/shabon-fx` (MIT but 8★
React-coupled, too immature), `TheNaubit/react-aurora-background` (MIT, 9★ single
component), `vinayakkulkarni/nxui` (MIT but a Vue-3 component library, wrong-framework
source — not a shader library).

Casberry particles: **Excluded** (vetted 2026-11-12) — particles.casberry.in is
a proprietary web toy by CasberryTech Pvt. Ltd., not a library: the effect
source is not published (`github.com/casberry` has only an unlicensed
portfolio repo; nothing on npm). Nothing redistributable exists.

Spline: **Excluded** (vetted 2026-11-12) — `@splinetool/react-spline` is MIT
© 2022 Spline, Inc. (LICENSE verified), but it is a thin wrapper over
`@splinetool/runtime`, which ships **no license**: no `license` field in
package.json (v2.0.179, re-checked 2026-11-13 — still none), zero
LICENSE/NOTICE files across the 372-file
published tarball, and the repo npm points to (`splinetool/spline`) is
private/404. Same precedent as ShaderGradient: a wrapper license without a
grant on the engine is not a license. Re-vet only if Spline publishes the
runtime; Solid portability is moot (the vanilla runtime would have been the
portable part).

Framer: **Excluded — tooling, not a source** (vetted 2026-11-12). framer.com
is a closed-source site builder; official developer docs state "Framer has no
code export" and code flows *into* Framer as React code components. The
third-party exporters (Unframer, Deframer, Proofly React Export) emit
generated React-19 bundles behind paid services with their own runtime
packages — not portable source and nothing license-vettable.
`framer-motion` is already allowed as `motion`.

Cursify: **Excluded** — `ui-layouts/cursify` ships no license (GitHub API
`license: null`; request open since Mar 2025). The prior "MIT Approved" row in
LICENSE-SOURCES.md was wrong and has been corrected. Aceternity (conditional),
Codrops and Shadertoy derivatives (excluded): unchanged.

ShaderGradient: **Excluded** — `ruucm/shadergradient` (3k★; `rdev/shadergradient`
was the wrong guess) has GitHub API `license: null` and no LICENSE file at root
or in `packages/react/`, despite the README claiming "MIT © ruucm,
stone-skipper" and npm shipping `license: MIT`. Same precedent as Cursify:
a README/npm claim without a grant file is not a license. Re-vet only if
upstream adds a LICENSE file; it is React-three-fiber + three + camera-controls
coupled, so any future port is a full raw-three rewrite.

21st.dev: **Conditional, cherry-pick only** — the platform repo
`serafimcloud/21st` is MIT (verified), but registry content is authored by
thousands of third parties (12k+ components) and installs are API-key-gated
with a paid tier. Per-component vetting **is** feasible — each component's
registry JSON exposes a `License:` field plus author (verified on
`21st.dev/r/shadcn/accordion.json` → `mit`) — so it is usable for targeted
picks with per-component provenance headers, never as a bulk source. Premium/
membership-gated content is excluded. React + Radix/shadcn coupling means every
pick is a rewrite regardless.

---

## PORTING.md §1 — exact allowed-imports edits (documented, NOT yet applied)

Current text (PORTING.md lines 31–33):

```markdown
- Allowed imports: `solid-js`, `solid-js/web`, `motion`, `gsap` (+ its plugin
  subpaths), `ogl`, `three`, `matter-js`, `vgpu`, `@hugeicons/core-free-icons`,
  `@use-gesture/vanilla`, and `@/lib/HugeiconsIcon` / `@/lib/reducedMotion`.
```

Required replacement (adds the two vetted engines):

```markdown
- Allowed imports: `solid-js`, `solid-js/web`, `motion`, `gsap` (+ its plugin
  subpaths), `animejs` (+ its subpath modules: `animejs/svg`, `animejs/utils`,
  `animejs/text`, `animejs/timer`, `animejs/easings`), `@tsparticles/engine` +
  `@tsparticles/slim`, `ogl`, `three`, `matter-js`, `vgpu`,
  `@hugeicons/core-free-icons`, `@use-gesture/vanilla`, and
  `@/lib/HugeiconsIcon` / `@/lib/reducedMotion`.
```

Secondary edits the pilot should carry in the same PR (keeps PORTING.md the
single source of porting truth):

- §4 cleanup list, add: anime.js v4 → `anim.revert()` / `tl.revert()` in
  `onCleanup`; tsParticles → `container.destroy()` in `onCleanup`.
- §5 dependency mapping, add an `### animejs v4` subsection documenting
  `createTimeline`/`stagger`/`animejs/svg` patterns and the `.revert()`
  disposal rule (mirror the `motion` section's structure).
