// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/noise-texture.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import { createUniqueId, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface NoiseTextureProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** Extra classes merged onto the root `svg` element. */
  className?: string
  /**
   * `baseFrequency` for `feTurbulence`; higher values yield finer-grained noise.
   * @default 0.4
   */
  frequency?: number
  /**
   * `numOctaves` for `feTurbulence`; more octaves add detail at smaller scales.
   * @default 6
   */
  octaves?: number
  /**
   * Linear slope on each channel after desaturation; adjusts contrast of the noise.
   * @default 0.15
   */
  slope?: number
  /**
   * Opacity of the filled noise layer (`rect`).
   * @default 0.6
   */
  noiseOpacity?: number
}

/**
 * Noise Texture Component
 *
 * A static SVG grain overlay built from an `feTurbulence` filter, desaturated
 * and contrast-adjusted via `feColorMatrix`/`feComponentTransfer`.
 *
 * PORT-NOTE: upstream types props as React `ComponentProps<"svg">` with
 * `[key: string]: unknown`; the Solid port uses `JSX.SvgSVGAttributes` and
 * spreads via `splitProps`.
 */
export function NoiseTexture(props: NoiseTextureProps) {
  const [own, rest] = splitProps(props, [
    'class',
    'className',
    'frequency',
    'octaves',
    'slope',
    'noiseOpacity',
  ])

  const frequency = () => own.frequency ?? 0.4
  const octaves = () => own.octaves ?? 6
  const slope = () => own.slope ?? 0.15
  const noiseOpacity = () => own.noiseOpacity ?? 0.6

  const filterId = createUniqueId()

  return (
    <svg
      class={`pointer-events-none absolute inset-0 z-0 size-full select-none opacity-50 dark:opacity-[0.75] ${own.class ?? ''} ${own.className ?? ''}`}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <filter id={filterId}>
        {/* baseFrequency/numOctaves/stitchTiles are the real camelCase SVG
            attribute names — PORTING.md's hyphenation rule does not apply. */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={frequency()}
          numOctaves={octaves()}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope={slope()} />
          <feFuncG type="linear" slope={slope()} />
          <feFuncB type="linear" slope={slope()} />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} opacity={noiseOpacity()} />
    </svg>
  )
}

export default NoiseTexture
