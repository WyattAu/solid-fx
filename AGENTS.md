# AGENTS.md — operating contract for solid-fx

Animated, interactive **SolidJS** components — a component-for-component
port of [react-bits](https://github.com/DavidHDev/react-bits) (TypeScript +
Tailwind variant) plus original extras (instruments, data, FX, emergent,
OSINT, SEO). Licensed MIT + Commons Clause — derived work, do not sell
the library itself. Distributed as installable source via jsrepo.

## Layout

- `src/content/<Category>/<Name>/<Name>.tsx` — one dir per component, mirroring
  upstream `src/ts-tailwind`. Categories: `Animations`, `Backgrounds`,
  `Components`, `Micro`, `TextAnimations`.
- `src/content/<Category>/<Name>/<Name>Demo.tsx` — demo harness; rendered by
  the docs site through `src/islands/DemoIsland.tsx` (its only consumer).
- `src/content/index.ts` — GENERATED barrel (`bun run gen:index`). Never edit.
- `src/extras/<source>/<Category>/<Name>/<Name>.tsx` (+`Demo.tsx`) — extras
  widgets from 22 sources: magic-ui, motion-primitives, animata, tsparticles,
  anime-js, kokonut, osint, seo, instruments, data, fx, emergent, gradient-gl,
  paper-shaders, lenis, splitting, canvas-confetti, auto-animate,
  gl-transitions, animate-ui (see `LICENSE-SOURCES.md` for vetting).
- `src/scenes/` — full-page scene compositions (11).
- `docs/` — GENERATED Starlight pages, one per component (`bun run gen:docs`).
- `src/lib/` — the only shared-code layer: `HugeiconsIcon.tsx`, `num.ts`
  (zero-Wasm numerics kernels; unit-tested in `tests/num.test.ts`),
  `reducedMotion.ts`, `syntheticPointer.ts`, `urlState.ts`. Components
  import it via `@/lib/*`.
- `registry.json` — GENERATED jsrepo manifest at repo root
  (`bunx jsrepo build`). Never hand-edit; freshness is CI-gated
  (`registry:check`). Item names are bare (`GpuHistogram`); shared libs
  ship as `lib/*` items auto-wired via `registryDependencies`.
- `astro.config.mjs` — Astro 7 + Starlight + `@astrojs/solid-js` docs site.
- `src/site/global.css` — Tailwind v4 entry (scans `src/content` via `@source`).
- `PORTING.md` — the React→Solid translation contract. **It is law for all
  porting work.** Read it before touching `src/content`.

## Verbs (Makefile == package.json scripts — run via **bun**)

Install with `bun install`. Every verb is `bun run <script>` or `make <verb>`.

| Verb                          | Meaning                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `make build`                  | gen:index → gen:docs → tsc --noEmit → astro build                             |
| `make test`                   | vitest (barrel smoke + num/urlState kernels)                                  |
| `make lint`                   | biome lint                                                                    |
| `make fmt` / `make fmt-check` | biome format                                                                  |
| `make coverage`               | vitest --coverage                                                             |
| `make contract`               | React-free + layering oracle over `src/content` (`scripts/check-contract.sh`) |
| `registry:check`              | jsrepo build + `git diff --exit-code registry.json` (manifest freshness)      |
| `make ci`                     | build + test + fmt-check + lint + contract + registry:check                   |

## Rules

1. `src/content` must contain **zero React imports**. `make contract` fails on
   `react`, `react-dom`, `motion/react`, `framer-motion`, `@hugeicons/react`,
   `@gsap/react`, `@use-gesture/react`, `@react-three/*`, or React hook calls.
   Ported code uses `solid-js`, vanilla `motion`, `gsap`, `ogl`, `three`,
   `matter-js`, `vgpu`, `@hugeicons/core-free-icons` + `src/lib/HugeiconsIcon`,
   `@use-gesture/vanilla`.
2. **Dependency layers point one way only** (estate rust-kit philosophy):
   `docs/` (generated) → `src/islands` → `<Name>Demo.tsx` → component →
   `src/lib` → external packages. Components never import other components,
   never import demos, islands, or site code — only `solid-js`, `solid-js/web`,
   externals, and `@/lib/*`. Shared logic lives in `src/lib` exactly once; if
   two components would duplicate nontrivial code, lift it into `src/lib`.
   Generated artifacts (`src/content/index.ts`, `docs/`, `registry.json`)
   are produced by `scripts/gen-index.mjs` / `scripts/gen-docs.mjs` /
   `bunx jsrepo build` and never hand-edited.
3. Every port keeps the upstream component's **public surface**: same default
   export name, same props (names and semantics), same visual result. Flag
   unavoidable approximations with `// PORT-NOTE: <reason>` — `make contract
   --strict` counts them and eventually must reach zero.
4. Cleanup is not optional: every timer, listener, RAF loop, GSAP context,
   WebGL context, observer, and `motion` animation is disposed in `onCleanup`.
5. Strict TS. No `any` unless upstream forces it; justify inline.
6. Do not edit generated files, do not edit other agents' component dirs, do
   not reformat the whole tree.
7. Verify your own work: `bun x tsc --noEmit` and fix errors in files you own
   (ignore errors in dirs assigned to others).
8. The dev tree flaps: after any successful milestone, commit immediately.
9. **Consumer contract is CI-enforced**: blocks must stay installable via a
   bare `npx jsrepo add github/WyattAu/solid-fx/<Name>` (registry:check gates
   manifest freshness). New blocks need no config work — `jsrepo.config.ts`
   enumerates automatically — but a new `@/lib/*` import only resolves if the
   module is registered as a `lib/*` item in that config. Requires Solid 1.9.x;
   2.x compat is an open audit (see PLAN).
10. Roadmap gates live in `PLAN.md` (Phase B/C triggers) and `metrics/DEMAND.md`;
    the GPU watchlist and extras batches are signal-gated — do not start new
    widget batches without an external-consumer trigger.
