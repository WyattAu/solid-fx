// Source: github.com/ibelick/motion-primitives components/core/progressive-blur.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream renders motion.div layers but animates nothing on them —
// they are plain divs with identical inline styles here. The framer rest-props
// spread maps to a splitProps rest spread on both wrapper and layers. Upstream
// derives segmentSize from blurLayers (not the max()ed layer count); kept
// as-is for visual parity.

import { For, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export const GRADIENT_ANGLES = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
} as const

export type ProgressiveBlurProps = {
  direction?: keyof typeof GRADIENT_ANGLES
  blurLayers?: number
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  blurIntensity?: number
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'>

export function ProgressiveBlur(props: ProgressiveBlurProps) {
  const [own, rest] = splitProps(props, [
    'direction',
    'blurLayers',
    'class',
    'className',
    'blurIntensity',
  ])

  const layers = () => Math.max(own.blurLayers ?? 8, 2)
  const segmentSize = () => 1 / ((own.blurLayers ?? 8) + 1)

  return (
    <div class={`relative ${own.class ?? ''} ${own.className ?? ''}`}>
      <For each={Array.from({ length: layers() })}>
        {(_, index) => {
          const i = index()
          const angle = GRADIENT_ANGLES[own.direction ?? 'bottom']
          const gradientStops = [
            i * segmentSize(),
            (i + 1) * segmentSize(),
            (i + 2) * segmentSize(),
            (i + 3) * segmentSize(),
          ].map(
            (pos, posIndex) =>
              `rgba(255, 255, 255, ${posIndex === 1 || posIndex === 2 ? 1 : 0}) ${pos * 100}%`,
          )

          const gradient = `linear-gradient(${angle}deg, ${gradientStops.join(', ')})`

          return (
            // Upstream spreads the rest props on each layer, after the
            // computed style — caller style overrides the layer style there.
            <div
              class="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={
                {
                  'mask-image': gradient,
                  '-webkit-mask-image': gradient,
                  'backdrop-filter': `blur(${i * (own.blurIntensity ?? 0.25)}px)`,
                  '-webkit-backdrop-filter': `blur(${i * (own.blurIntensity ?? 0.25)}px)`,
                } as JSX.CSSProperties
              }
              {...(rest as unknown as JSX.HTMLAttributes<HTMLDivElement>)}
            />
          )
        }}
      </For>
    </div>
  )
}

export default ProgressiveBlur
