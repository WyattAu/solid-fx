# solid-fx

> 218 animated, interactive components for **SolidJS** — a component-for-component
> port of [react-bits](https://github.com/DavidHDev/react-bits) (TypeScript +
> Tailwind variant) to SolidJS idioms, plus 181 extras widgets from twelve
> additional sources and 11 full-page scenes.

**Status: `CURRENT`** — 218/218 react-bits components ported with **0
`PORT-NOTE` markers** (React-free contract oracle green), plus 180 extras
widgets (Magic UI ×40, Motion Primitives ×43, Animata ×36, tsParticles ×9,
anime.js ×5, Kokonut ×3, original OSINT ×8, SEO ×11, Instruments ×11,
Data ×9, FX ×4, Emergent ×3) and 11 scenes. Every component typechecks
(`tsc --noEmit` clean), the barrel smoke test passes, and the Starlight
site builds all 410 demo pages with sidebar navigation (`bun run build`;
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

## Install (once the port stabilizes)

Components are consumed as source, like react-bits:

```bash
npx jsrepo add github/WyattAu/solid-fx/src/content/TextAnimations/SplitText
```

## License

MIT + Commons Clause, inherited from react-bits — see `LICENSE.md`.
Free for personal and commercial use **inside your product**; the library
itself may not be sold. Port copyright derives from David Haz's original.
