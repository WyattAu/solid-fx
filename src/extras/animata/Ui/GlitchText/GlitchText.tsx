// Source: github.com/codse/animata animata/text/glitch-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream imports ./glitch-text.css; the stylesheet is inlined in
// an enclosing <style> element (component-scoped keyframes can't ship as
// Tailwind classes). PORT-NOTE: the base-color default resolves against the
// upstream-site token var(--text-foreground) with a currentColor fallback so
// the port works outside upstream's token set. React span props pass through
// via splitProps; `class`/`className` merge (upstream used cn()).
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

export interface GlitchTextProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: string
  /** Unitless multiplier on `--glitch-step`. @default 5 (via CSS) */
  intensity?: number
  /** Base offset unit — em scales with font size. @default "0.01em" */
  step?: string
  /** Glitch burst cycle. Numbers are seconds (`2.5` → `2.5s`). @default 2.5 */
  duration?: number | string
  /** Main layer color (on top). @default inherits upstream token / currentColor */
  baseColor?: string
  /** Back ghost layer A. @default "#ff00ff" */
  colorA?: string
  /** Back ghost layer B. @default "#00ffff" */
  colorB?: string
  /** Ghost layer blend mode. @default "screen" */
  blendMode?: 'screen' | 'normal'
  /** React parity alias; merges with `class`. */
  className?: string
}

function glitchDuration(duration: number | string) {
  return typeof duration === 'number' ? `${duration}s` : duration
}

/**
 * RGB glitch via stacked text layers — ghosts animate transform only (compositor),
 * base stays full-color on top. Props map to CSS variables; defaults live in the
 * inlined stylesheet below.
 */
const glitchStyles = `
.glitch-text {
  --glitch-intensity: 5;
  --glitch-step: 0.01em;
  --glitch-duration: 2.5s;
  --glitch-color-base: var(--text-foreground, currentColor);
  --glitch-color-a: #ff00ff;
  --glitch-color-b: #00ffff;
  --glitch-blend-mode: screen;

  /* Derived offsets — em-relative so glitch scales with font-size. */
  --glitch-x: calc(var(--glitch-intensity) * var(--glitch-step));
  --glitch-y: max(var(--glitch-step), calc(var(--glitch-x) * 0.35));
  --glitch-x-1: calc((var(--glitch-intensity) - 1) * var(--glitch-step));
  --glitch-x-2: calc((var(--glitch-intensity) - 2) * var(--glitch-step));

  position: relative;
  display: inline-grid;
  grid-template-areas: stack;
}

.glitch-text__ghost-a,
.glitch-text__ghost-b,
.glitch-text__base {
  grid-area: stack;
}

.glitch-text__ghost-a {
  color: var(--glitch-color-a);
  mix-blend-mode: var(--glitch-blend-mode);
  animation: glitch-a var(--glitch-duration) infinite;
}

.glitch-text__ghost-b {
  color: var(--glitch-color-b);
  mix-blend-mode: var(--glitch-blend-mode);
  animation: glitch-b var(--glitch-duration) infinite;
}

.glitch-text__base {
  position: relative;
  z-index: 2;
  color: var(--glitch-color-base);
}

@keyframes glitch-a {
  0%, 88%, 100% {
    transform: translate(0, 0);
    opacity: 0.85;
  }
  90% {
    transform: translate(calc(var(--glitch-x) * -1), calc(var(--glitch-y) * -1));
    opacity: 1;
  }
  92% {
    transform: translate(var(--glitch-x-1), var(--glitch-y));
    opacity: 0.9;
  }
  94% {
    transform: translate(calc(var(--glitch-x-2) * -1), 0);
    opacity: 1;
  }
  96% {
    transform: translate(var(--glitch-x), calc(var(--glitch-y) * -1));
    opacity: 0.85;
  }
}

@keyframes glitch-b {
  0%, 86%, 100% {
    transform: translate(0, 0);
    opacity: 0.85;
  }
  88% {
    transform: translate(var(--glitch-x), var(--glitch-y));
    opacity: 1;
  }
  91% {
    transform: translate(calc(var(--glitch-x) * -1), calc(var(--glitch-y) * -1));
    opacity: 0.9;
  }
  93% {
    transform: translate(var(--glitch-x-1), 0);
    opacity: 1;
  }
  95% {
    transform: translate(calc(var(--glitch-x-2) * -1), var(--glitch-y));
    opacity: 0.85;
  }
}

@media (prefers-reduced-motion: reduce) {
  .glitch-text__ghost-a,
  .glitch-text__ghost-b {
    animation: none;
    opacity: 0.35;
  }
}
`

export default function GlitchText(props: GlitchTextProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'intensity',
    'step',
    'duration',
    'baseColor',
    'colorA',
    'colorB',
    'blendMode',
    'style',
    'class',
    'className',
  ])

  const text = () => own.children

  const style = () =>
    ({
      ...(own.intensity !== undefined && { '--glitch-intensity': own.intensity }),
      ...(own.step !== undefined && { '--glitch-step': own.step }),
      ...(own.duration !== undefined && {
        '--glitch-duration': glitchDuration(own.duration),
      }),
      ...(own.baseColor !== undefined && { '--glitch-color-base': own.baseColor }),
      ...(own.colorA !== undefined && { '--glitch-color-a': own.colorA }),
      ...(own.colorB !== undefined && { '--glitch-color-b': own.colorB }),
      ...(own.blendMode !== undefined && { '--glitch-blend-mode': own.blendMode }),
      ...(typeof own.style === 'object' && own.style),
    }) as JSX.CSSProperties

  return (
    <span {...rest} class={`glitch-text ${own.class ?? ''} ${own.className ?? ''}`} style={style()}>
      <style>{glitchStyles}</style>
      <span aria-hidden class="glitch-text__ghost-a select-none">
        {text()}
      </span>
      <span aria-hidden class="glitch-text__ghost-b select-none">
        {text()}
      </span>
      <span class="glitch-text__base">{text()}</span>
    </span>
  )
}
