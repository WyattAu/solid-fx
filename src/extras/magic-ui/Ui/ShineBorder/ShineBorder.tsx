// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/shine-border.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { createMemo, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface ShineBorderProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> {
  /**
   * Width of the border in pixels
   * @default 1
   */
  borderWidth?: number
  /**
   * Duration of the animation in seconds
   * @default 14
   */
  duration?: number
  /**
   * Color of the border, can be a single color or an array of colors
   * @default "#000000"
   */
  shineColor?: string | string[]
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  style?: JSX.CSSProperties
}

/**
 * Shine Border
 *
 * An animated background border effect component with configurable properties.
 *
 * PORT-NOTE: upstream's `motion-safe:animate-shine` relies on the registry
 * Tailwind theme (`--animate-shine: shine var(--duration) infinite linear`
 * plus its keyframes in apps/www/styles/globals.css). Embedded here so the
 * port is self-contained; the class ships as `animate-magic-shine` so it can
 * never collide with a site-side `--animate-shine` utility definition, and
 * the `motion-safe:` variant becomes a `prefers-reduced-motion` media query
 * with identical semantics.
 */
const STYLE = `
@keyframes magic-shine {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  to {
    background-position: 0% 0%;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .animate-magic-shine {
    animation: magic-shine var(--duration) infinite linear;
  }
}
`

export const ShineBorder = (props: ShineBorderProps) => {
  const [own, rest] = splitProps(props, [
    'borderWidth',
    'duration',
    'shineColor',
    'class',
    'className',
    'style',
  ])

  const borderWidth = () => own.borderWidth ?? 1
  const duration = () => own.duration ?? 14
  const shineColor = () => own.shineColor ?? '#000000'

  const style = createMemo(() => {
    const color = shineColor()
    return {
      '--border-width': `${borderWidth()}px`,
      '--duration': `${duration()}s`,
      'background-image': `radial-gradient(transparent,transparent, ${
        Array.isArray(color) ? color.join(',') : color
      },transparent,transparent)`,
      'background-size': '300% 300%',
      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      '-webkit-mask-composite': 'xor',
      'mask-composite': 'exclude',
      padding: 'var(--border-width)',
      ...(own.style ?? {}),
    } as JSX.CSSProperties
  })

  return (
    <>
      <style>{STYLE}</style>
      <div
        style={style()}
        class={`animate-magic-shine pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position] ${own.class ?? ''} ${own.className ?? ''}`}
        {...rest}
      />
    </>
  )
}

export default ShineBorder
