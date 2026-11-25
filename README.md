# solid-fx

> 218 animated, interactive components for **SolidJS** — a component-for-component
> port of [react-bits](https://github.com/DavidHDev/react-bits) (TypeScript +
> Tailwind variant) to SolidJS idioms, plus 207 extras widgets from twenty-one
> additional sources and 11 full-page scenes.

**Status: `CURRENT`** — 218/218 react-bits components ported with **0
`PORT-NOTE` markers** (React-free contract oracle green), plus 206 extras
widgets (Magic UI ×40, Motion Primitives ×43, Animata ×36, tsParticles ×9,
anime.js ×5, Kokonut ×3, original OSINT ×8, SEO ×11, Instruments ×15,
Data ×13, FX ×6, Emergent ×4, Rough Notation ×1, Splitting ×1,
Canvas Confetti ×1, Auto Animate ×1, GL Transitions ×1, Animate UI ×2,
Paper Shaders ×3, Gradient GL ×2, Lenis ×2) and 11 scenes. Every component typechecks
(`tsc --noEmit` clean), the barrel smoke test passes, and the Starlight
site builds all 436 demo pages with sidebar navigation (`bun run build`;
live at
https://wyattau.github.io/solid-fx/).

## What this is

- Text animations, animations, components, micro-interactions, and backgrounds
  (218 total), each a single self-contained `.tsx` under
  `src/content/<Category>/<Name>/<Name>.tsx`.
- Extras in `src/extras/<source>/<Category>/<Name>/<Name>.tsx` — ported
  widgets plus two original categories (OSINT, SEO) built on free keyless
  APIs.
- Scenes in `src/scenes/` — full-page compositions; the only layer allowed
  to compose multiple components.
- TypeScript strict + Tailwind CSS v4.
- Copy-paste friendly: components import nothing outside `solid-js`/`solid-js/web`,
  the libraries they actually use (`gsap`, `motion`, `ogl`, `three`,
  `matter-js`, `vgpu`, `@tsparticles`, `animejs`), and at most `src/lib`
  helpers.
- `research/` — scored survey of 200 browser-native design/widget concepts
  driving the extras roadmap (batches 11–15).

## Dev site

```bash
bun install
bun run dev        # Astro + Starlight docs site; live demo per component
```

Stack: **TypeScript + SolidJS + Tailwind v4** components, **Astro + Starlight**
docs site (Solid islands), **bun** toolchain, **Biome** lint/format.

## Install

Components are consumed as source, like react-bits. Two steps — drop a
9-line config (picks where blocks land; your layout, your control), then
add:

```ts
// jsrepo.config.ts
import { defineConfig } from 'jsrepo'

export default defineConfig({
  registries: ['github/WyattAu/solid-fx'],
  paths: {
    component: '@/components',
    lib: '@/lib',
  },
})
```

```bash
bunx jsrepo add GpuHistogram          # extras
bunx jsrepo add SplitText             # react-bits ports
```

Verified end to end in a scratch consumer: shared modules (`num.ts`,
`HugeiconsIcon`, …) come along automatically and everything typechecks
strict under `solid-js@1.9`. Without the config, `jsrepo add` prompts for
a destination path — a bare `--yes` one-liner is not supported (the CLI
ignores registry defaults for scripted adds).

Requires **SolidJS 1.9.x** (2.x compat audit in progress). Imports use the
`@/*` alias — map `"@/*": ["./src/*"]` in your tsconfig (Vite/Astro default)
or move the files and fix imports.

## Stability

Two bands under one version axis:

- **Content ports (218)** — `src/content/*`: stable. Public surface mirrors
  upstream react-bits 1:1 by contract (`PORTING.md`); changes track upstream,
  not whim.
- **Extras (195 + 5 lib modules)** — `src/extras/*`, `src/lib/*`: experimental.
  Props may shift before 1.0; family-level churn is expected and
  CHANGELOG-documented.

## License

MIT + Commons Clause, inherited from react-bits — see `LICENSE.md`.
Free for personal and commercial use **inside your product**; the library
itself may not be sold. Port copyright derives from David Haz's original.
