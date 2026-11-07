# EXTRAS-ROADMAP.md — non-react-bits sources, prioritized

Companion to `LICENSE-SOURCES.md` (license verdicts) and `PORTING.md` (law).
Everything here targets `src/extras/<source>/<Category>/<Name>/<Name>.tsx` per
LICENSE-SOURCES.md rule 2. Verified 2026-11-06; backlog candidates license-vetted
2026-11-07.

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

## Excluded / unchanged

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
