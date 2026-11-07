// Source: github.com/magicuidesign/magic-ui apps/www/registry/magicui/shimmer-button.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface ShimmerButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The color of the shimmer sweep.
   */
  shimmerColor?: string
  /**
   * The size of the shimmer border cut (any CSS length).
   */
  shimmerSize?: string
  /**
   * The border radius of the button (any CSS length).
   */
  borderRadius?: string
  /**
   * The duration of the shimmer animation (any CSS time).
   */
  shimmerDuration?: string
  /**
   * The background of the button.
   */
  background?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

// PORT-NOTE: upstream ships the animation utilities through the Tailwind
// theme (`--animate-shimmer-slide` / `--animate-spin-around` plus their
// keyframes in the registry CSS). They are embedded here so the port is
// self-contained without touching the site's Tailwind theme.
const STYLE = `
@keyframes shimmer-slide {
  to { transform: translate(calc(100cqw - 100%), 0) }
}
@keyframes spin-around {
  0% { transform: translateZ(0) rotate(0) }
  15%, 35% { transform: translateZ(0) rotate(90deg) }
  65%, 85% { transform: translateZ(0) rotate(270deg) }
  100% { transform: translateZ(0) rotate(360deg) }
}
.animate-shimmer-slide {
  animation: shimmer-slide var(--speed, 3s) ease-in-out infinite alternate;
}
.animate-spin-around {
  animation: spin-around calc(var(--speed, 3s) * 2) infinite linear;
}
`

export function ShimmerButton(props: ShimmerButtonProps) {
  const [own, rest] = splitProps(props, [
    'shimmerColor',
    'shimmerSize',
    'borderRadius',
    'shimmerDuration',
    'background',
    'class',
    'className',
    'style',
    'children',
  ])

  const shimmerColor = () => own.shimmerColor ?? '#ffffff'
  const shimmerSize = () => own.shimmerSize ?? '0.05em'
  const shimmerDuration = () => own.shimmerDuration ?? '3s'
  const borderRadius = () => own.borderRadius ?? '100px'
  const background = () => own.background ?? 'rgba(0, 0, 0, 1)'

  return (
    <button
      {...rest}
      style={{
        '--spread': '90deg',
        '--shimmer-color': shimmerColor(),
        '--radius': borderRadius(),
        '--speed': shimmerDuration(),
        '--cut': shimmerSize(),
        '--bg': background(),
        // PORT-NOTE: upstream's trailing `{...props}` spread clobbers caller
        // style entirely; the port merges object styles after the CSS vars so
        // both apply (string styles are ignored — callers should pass objects).
        ...(typeof own.style === 'string' ? {} : own.style),
      }}
      class={`group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] border border-white/10 px-6 py-3 whitespace-nowrap text-white [background:var(--bg)] transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <style>{STYLE}</style>
      {/* spark container */}
      <div class="-z-30 blur-[2px] @container-[size] absolute inset-0 overflow-visible">
        {/* spark */}
        <div class="animate-shimmer-slide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
          {/* spark before */}
          <div class="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
        </div>
      </div>
      {own.children}

      {/* Highlight */}
      <div class="absolute inset-0 size-full rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f] transform-gpu transition-all duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] group-active:shadow-[inset_0_-10px_10px_#ffffff3f]" />

      {/* backdrop */}
      <div class="absolute inset-(--cut) -z-20 [border-radius:var(--radius)] [background:var(--bg)]" />
    </button>
  )
}

export default ShimmerButton
