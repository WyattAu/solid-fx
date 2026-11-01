# AGENTS.md — operating contract for solid-bits

Animated, interactive **SolidJS** components, ported component-for-component
from [react-bits](https://github.com/DavidHDev/react-bits) (TypeScript +
Tailwind variant). Licensed MIT + Commons Clause — derived work, do not sell
the library itself.

## Layout

- `src/content/<Category>/<Name>/<Name>.tsx` — one dir per component, mirroring
  upstream `src/ts-tailwind`. Categories: `Animations`, `Backgrounds`,
  `Components`, `Micro`, `TextAnimations`.
- `src/content/<Category>/<Name>/<Name>Demo.tsx` — demo harness, rendered by
  the dev site (`npm run dev`).
- `src/content/index.ts` — GENERATED barrel (`npm run gen:index`). Never edit.
- `src/lib/` — shared Solid helpers (`HugeiconsIcon`, `useReducedMotion`).
- `src/demo/` — dev site shell (hash-routed category pages).
- `PORTING.md` — the React→Solid translation contract. **It is law for all
  porting work.** Read it before touching `src/content`.

## Verbs (Makefile == package.json scripts)

| Verb | Meaning |
| --- | --- |
| `make build` | gen:index → tsc --noEmit → vite build |
| `make test` | vitest (barrel smoke test) |
| `make lint` | tsc --noEmit |
| `make fmt` / `make fmt-check` | prettier |
| `make coverage` | vitest --coverage |
| `make contract` | React-free oracle over `src/content` (`scripts/check-contract.sh`) |
| `make ci` | build + test + fmt-check + contract |

## Rules

1. `src/content` must contain **zero React imports**. `make contract` fails on
   `react`, `react-dom`, `motion/react`, `framer-motion`, `@hugeicons/react`,
   `@gsap/react`, `@use-gesture/react`, `@react-three/*`, or React hook calls.
   Ported code uses `solid-js`, vanilla `motion`, `gsap`, `ogl`, `three`,
   `matter-js`, `vgpu`, `@hugeicons/core-free-icons` + `src/lib/HugeiconsIcon`,
   `@use-gesture/vanilla`.
2. Every port keeps the upstream component's **public surface**: same default
   export name, same props (names and semantics), same visual result. Flag
   unavoidable approximations with `// PORT-NOTE: <reason>` — `make contract
   --strict` counts them and eventually must reach zero.
3. Cleanup is not optional: every timer, listener, RAF loop, GSAP context,
   WebGL context, observer, and `motion` animation is disposed in `onCleanup`.
4. Strict TS. No `any` unless upstream forces it; justify inline.
5. Do not edit generated files, do not edit other agents' component dirs, do
   not reformat the whole tree.
6. Verify your own work: `npx tsc --noEmit` and fix errors in files you own
   (ignore errors in dirs assigned to others).
7. The dev tree flaps: after any successful milestone, commit immediately.
