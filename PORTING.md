# PORTING.md — React → Solid translation contract

Every component in `src/content` is a hand-port of a react-bits TS-Tailwind
component. Upstream source: `~/dev/src/github.com/DavidHDev/react-bits/src/ts-tailwind/<Category>/<Name>/<Name>.tsx`.
Reference ports (read both first): `src/content/Animations/AnimatedContent/AnimatedContent.tsx`
(GSAP + ScrollTrigger patterns) and `src/content/Micro/StatusMark/StatusMark.tsx`
(vanilla `motion` patterns: `motionValue`, `animate`, `.on('change')`).

## 1. Ground rules

> **Toolchain: bun.** This repo uses bun (`bun install`, `bun run <verb>`).
> Typecheck with `./node_modules/.bin/tsc --noEmit` (or `bun x tsc --noEmit`).

- One dir per component: `src/content/<Category>/<Name>/<Name>.tsx`, plus a demo
  `<Name>Demo.tsx` in the same dir. Nothing else unless upstream has extra files.
- Component keeps the **same default export name** (`export default Name;`) and
  the **same props interface** (names, types, defaults, semantics). It is a
  drop-in for the same job as upstream.
- Keep upstream code structure (helpers, constants, shader strings, math) as
  intact as possible. Translate the framework layer only — do not redesign.
- Preserve `// PORT-NOTE: <reason>` comments for any behavioral approximation.
  They are greppable debt (`make contract --strict` counts them).
- Banned in `src/content` (enforced by `make contract`): imports from `react`,
  `react-dom`, `motion/react`, `framer-motion`, `@hugeicons/react`,
  `@gsap/react`, `@use-gesture/react`, `@react-three/*`, and any React hook
  calls. Do NOT add react-bits' `'use client'` directives.
- Allowed imports: `solid-js`, `solid-js/web`, `motion`, `gsap` (+ its plugin
  subpaths), `ogl`, `three`, `matter-js`, `vgpu`, `@hugeicons/core-free-icons`,
  `@use-gesture/vanilla`, and `@/lib/HugeiconsIcon` / `@/lib/reducedMotion`.

## 2. Core mapping

| React | Solid |
| --- | --- |
| `useState(s)` | `createSignal(s)` — **reads become calls**: `count()` in JSX/effects |
| `useEffect(fn, [])` | `onMount(fn)`; put cleanup inside via `onCleanup(() => ...)` |
| `useEffect(fn, [a, b])` | `createEffect(() => { ... a() ... b() ... })` (signals auto-track) or `onMount` + explicit signal watchers if simpler |
| `useLayoutEffect` | same as above (Solid effects run after DOM update) |
| `useRef<HTMLDivElement>(null)` (DOM) | `let el!: HTMLDivElement;` + `ref={el}` |
| `useRef<T>(x)` (mutable value) | plain `let value = x;` closure variable (component body runs once per instance) |
| `useCallback(fn, deps)` | plain function or `const fn = () => ...` |
| `useMemo(() => v, deps)` | `createMemo(() => v)` or plain computation if inputs aren't reactive |
| `useContext` | `useContext` from `solid-js` (rare; only 2 upstream uses) |
| React "latest callback" ref pattern (`useRef` holding a mutating callback, called at event time) | import `untrack` from `solid-js` (**it is `untrack`, NOT `untracked`**) and wrap the call: `untrack(() => props.onX?.())` |
| `useReducedMotion()` (motion/react) | `useReducedMotion()` from `@/lib/reducedMotion` — **returns an accessor**, call it: `const reduced = useReducedMotion(); if (reduced()) ...` |
| `{arr.map(x => <X ... />)}` | `<For each={arr}>{(x) => <X ... />}</For>` — never `.map` in JSX |
| `{cond && <X/>}` / ternaries | fine, or `<Show when={cond}>` |
| `key={...}` | delete — `<For>`/`<Index>` handle identity |
| `className` | `class` |
| `dangerouslySetInnerHTML={{ __html: h }}` | `innerHTML={h}` |
| `onChange` on text inputs | `onInput` (Solid fires per keystroke on `onInput` like React `onChange`) |
| `createPortal(node, target)` (react-dom) | `<Portal mount={target}>{node}</Portal>` from `solid-js/web` |
| `forwardRef` | not needed — accept `ref` through `props.ref` if upstream exposes one |
| `React.memo` / `useMemo`-on-component | drop entirely |
| `children` prop | `props.children` works directly in JSX: `<div>{props.children}</div>` |
| destructure `({ title, size = 16 })` | **FORBIDDEN** — access `props.title`, `props.size ?? 16`. Destructuring kills reactivity. In non-reactive one-shot positions (e.g. inside `onMount`) it is tolerated but avoid. |
| default param `function X({ a = 1 })` | `function X(props: XProps)` + `const a = () => props.a ?? 1;` or inline `props.a ?? 1` |

## 3. JSX specifics

- Event handlers keep React names (`onClick`, `onPointerMove`, `onWheel`, ...).
  Handlers receive the native event; use `e.currentTarget` (typed!) not `e.target`
  for the bound element.
- `style` objects use **hyphenated CSS property names** — unlike React! Solid's
  `CSSProperties` type rejects camelCase: write `style={{ 'background-color': x }}`,
  `{{ 'box-shadow': y }}`, `{{ 'will-change': z }}`, `{{ 'text-align': t }}`.
- SVG attributes are **hyphenated** too: `stroke-width`, `stroke-dasharray`,
  `stroke-linecap`, `fill-opacity`. (`pathLength`→`pathLength` stays as-is; it is
  a real DOM attribute.) Do not pass React-only attrs like `focusable` on `<svg>`.
- Event handlers must annotate their event type — Solid does not infer it from
  the JSX the way React TS does: `onPointerDown={(e: PointerEvent) => ...}`.
  `e.currentTarget` is typed as `EventTarget | null`; narrow it:
  `const el = e.currentTarget as HTMLDivElement; if (!el) return;`.
- Everything else keeps React names (`onClick`, `onPointerMove`, `onWheel`, ...).
- `ref={el}` assignment form: declare `let el!: HTMLDivElement;` above (definite
  assignment `!` because TS can't see the assignment). For elements rendered
  conditionally inside `<Show>`, prefer callback refs:
  `ref={(el) => { local = el; onCleanup(() => ...); }}`.
- Anything you'd do with `useEffect` *just* to read the DOM after mount belongs
  in `onMount` — but prefer real refs over querySelector.
- Dynamic class toggling: `classList={{ active: isActive() }}`.
- Merging caller classes: components accept `class?: string` (upstream used
  `className?`) and append it where upstream appended `className`. Keep the
  props name `class` for the Solid port, but ALSO accept `className?: string`
  and merge both if upstream's docs/examples pass `className` — cheap and
  prevents breakage: `class={`inner ${props.className ?? ''}`}` — prefer
  including both: ``class={`inner ${props.class ?? ''} ${props.className ?? ''}`}``.
- Wrapper components that rendered `props.children` in React render
  `{props.children}` in Solid — it is a JSX element, do not call it.

## 4. Cleanup discipline (mandatory)

Every effect of the following kinds gets an `onCleanup` in the same scope:

- `setTimeout`/`setInterval` → `clearTimeout`/`clearInterval`
- `requestAnimationFrame` loops → `cancelAnimationFrame`
- `addEventListener` → `removeEventListener` (same target + fn)
- GSAP → `gsap.context(...)` + `onCleanup(() => ctx.revert())`, or kill tweens/timelines
- `motion`'s `animate()` → keep the returned controls, `onCleanup(() => controls.stop())`
- three/ogl renderers → `renderer.dispose()`, `renderer.forceContextLoss()`, geometries/materials `.dispose()`
- `ResizeObserver`/`IntersectionObserver`/`MutationObserver` → `.disconnect()`
- vgpu frames → whatever `vgpu` exposes (check its types) — at minimum stop the frame loop

## 5. Dependency mapping

### motion/react → `motion` (vanilla, same package)

Upstream imports like `import { motion, AnimatePresence, useInView, useMotionValue, useSpring, animate, useScroll, useTransform, useReducedMotion } from 'motion/react'`.
There is no declarative `<motion.div>` in Solid. Rewrite imperatively:

- `animate(from, to, { onUpdate })` / `animate(el, keyframes, options)` — vanilla,
  returns controls (`.stop()`, `.then`). Use inside `onMount`/`createEffect`; stop in `onCleanup`.
- `useMotionValue(v)` → `createSignal(v)`; `mv.set(x)` → `setX(x)`; `mv.get()`/`mv.on('change')` → `x()` / `createEffect(() => { x() ... })`.
- `useSpring(mv)` → no direct equivalent; either keep raw signal (acceptable
  approximation, PORT-NOTE) or implement critically-damped smoothing in a
  rAF loop. Prefer the rAF spring when the feel is the point of the component.
- `useInView(ref, opts)` → `IntersectionObserver` in `onMount` + `onCleanup`.
- `useScroll` + `useTransform` → `window.addEventListener('scroll', ...)` (passive)
  or `scroll()` / `inView()` from `motion` where they fit; compute transforms manually.
- `AnimatePresence` (exit animations) → restructure: on close, run the exit
  `animate(...)` then remove from the DOM in `.then`/`onComplete` via a signal.
  Approximate with CSS transitions when simpler — PORT-NOTE it.
- `stagger` from `motion` works as-is with `animate`.

### @gsap/react `useGSAP(fn, { scope })`

→ `onMount(() => { const ctx = gsap.context(() => fn(), scopeEl); onCleanup(() => ctx.revert()); })`.
`gsap.registerPlugin(...)` calls stay at module top-level (upstream already does this).
`gsap/ScrollTrigger`, `gsap/SplitText`, `gsap/ScrambleTextPlugin` import the same way.

### @hugeicons/react

`<HugeiconsIcon icon={SomeIcon} size={24} color="..." strokeWidth={1.5} />`
→ import the icon data from `@hugeicons/core-free-icons` (same constant name)
and render with our Solid component: `import HugeiconsIcon, { type IconSvgObject } from '@/lib/HugeiconsIcon'`.
Same props: `icon`, `size`, `color`, `strokeWidth`, `class`, plus `style`.
(The package does not export `IconSvgObject`; ours in `@/lib/HugeiconsIcon` is
the canonical type — import it from there, never redeclare it.)

### @use-gesture/react

One component uses it. Either use `@use-gesture/vanilla` (`new Gesture(el, { onDrag })`,
`.destroy()` in cleanup) or hand-roll the pointer handlers if the gesture usage
is simple. PORT-NOTE if behavior differs.

### @react-three/fiber + drei (1 component)

Rewrite with raw `three`: scene/camera/renderer in `onMount`, rAF loop,
`ResizeObserver`, full disposal in `onCleanup`.PORT-NOTE any drei-only
convenience (e.g. `Environment`) you approximate.

### vgpu (2 components)

Framework-agnostic already. Swap the React lifecycle: init/`frame` loops in
`onMount`, teardown in `onCleanup`. Read `node_modules/vgpu` types for the API.

## 6. Demo contract (`<Name>Demo.tsx`)

- Default-exports `function <Name>Demo()`.
- Renders the component with sensible demo props at a reasonable size —
  self-contained, no network calls (use `https://picsum.photos/seed/<name>/<w>/<h>`
  when images are required), no user interaction required to look alive.
- Backgrounds: fixed height (e.g. `h-96 w-full`) container.
- Must not crash when mounted in isolation (this is our visual smoke test).
- Keep it under ~60 lines.

## 7. Verification (per agent)

1. `npx tsc --noEmit` from the repo root. Fix every error in **your** files;
   ignore errors in dirs assigned to other agents.
2. Re-read your port once against upstream for: missing cleanup, destructured
   props, `.map` in JSX, stale `className`, `useState`/`useRef` leftovers.
3. Do NOT run the dev site, `vite build`, or commit — the integrator does that.
