# solid-fx

> 218 animated, interactive components for **SolidJS** — a component-for-component
> port of [react-bits](https://github.com/DavidHDev/react-bits) (TypeScript +
> Tailwind variant) to SolidJS idioms.

**Status: `CURRENT`** — 218/218 components ported. Every component typechecks
(`tsc --noEmit` clean), the barrel smoke test passes, the React-free contract
oracle is green, and the Starlight site builds all 218 demo pages
(`bun run build`). 21 `PORT-NOTE` markers remain as the greppable debt ledger
(`make contract --strict` eventually must reach zero); visual QA against
reactbits.dev is the next milestone.

## What this is

- Text animations, animations, components, micro-interactions, and backgrounds
  (218 total), each a single self-contained `.tsx` under
  `src/content/<Category>/<Name>/<Name>.tsx`.
- TypeScript strict + Tailwind CSS v4.
- Copy-paste friendly: components import nothing outside `solid-js`/`solid-js/web`,
  the libraries they actually use (`gsap`, `motion`, `ogl`, `three`, `matter-js`,
  `vgpu`), and at most `src/lib` helpers.

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
