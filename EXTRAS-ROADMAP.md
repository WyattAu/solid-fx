# EXTRAS-ROADMAP.md — non-react-bits sources, prioritized

Companion to `LICENSE-SOURCES.md` (license verdicts) and `PORTING.md` (law).
Everything here targets `src/extras/<source>/<Category>/<Name>/<Name>.tsx` per
LICENSE-SOURCES.md rule 2. Verified 2026-11-06.

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

## Excluded / unchanged

Cursify: **Excluded** — `ui-layouts/cursify` ships no license (GitHub API
`license: null`; request open since Mar 2025). The prior "MIT Approved" row in
LICENSE-SOURCES.md was wrong and has been corrected. Aceternity (conditional),
Codrops and Shadertoy derivatives (excluded): unchanged.

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
