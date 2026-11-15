// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/rainbow-button.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.

import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

interface VariantOptions {
  variant?: 'default' | 'outline' | null
  size?: 'default' | 'sm' | 'lg' | 'icon' | null
  className?: string
}

// PORT-NOTE: upstream builds these with `cva` (class-variance-authority);
// replaced with static variant maps over the verbatim class strings.
const BASE_CLASSES =
  "relative cursor-pointer group transition-all animate-rainbow inline-flex items-center justify-center gap-2 shrink-0 rounded-sm outline-none focus-visible:ring-[3px] aria-invalid:border-destructive text-sm font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0"

const VARIANT_CLASSES: Record<NonNullable<VariantOptions['variant']>, string> = {
  default:
    'border-0 bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] text-primary-foreground [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.125rem)_solid_transparent] before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:bg-[length:200%] before:[filter:blur(0.75rem)] dark:bg-[linear-gradient(#fff,#fff),linear-gradient(#fff_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))]',
  outline:
    'border border-input border-b-transparent bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] text-accent-foreground [background-clip:padding-box,border-box,border-box] [background-origin:border-box] before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:bg-[length:200%] before:[filter:blur(0.75rem)] dark:bg-[linear-gradient(#0a0a0a,#0a0a0a),linear-gradient(#0a0a0a_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))]',
}

const SIZE_CLASSES: Record<NonNullable<VariantOptions['size']>, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-xl px-3 text-xs',
  lg: 'h-11 rounded-xl px-8',
  icon: 'size-9',
}

// PORT-NOTE: upstream ships the animation through the Tailwind theme
// (`--animate-rainbow`) plus the `rainbow` keyframes and `--color-*` HSL
// variables in the registry globals.css. They are embedded here so the port
// is self-contained without touching the site's Tailwind theme (same
// approach as Meteors/Marquee).
const STYLE = `
@keyframes rainbow {
  0% { background-position: 0%; }
  50% { background-position: 100%; }
  100% { background-position: 0%; }
}
.animate-rainbow {
  animation: rainbow 3s linear infinite;
}
`

type RainbowColorStyle = JSX.CSSProperties & {
  '--color-1': string
  '--color-2': string
  '--color-3': string
  '--color-4': string
  '--color-5': string
}

// Upstream resolves these from the registry's Tailwind theme
// (`--color-1: hsl(0 100% 63%)` … `--color-5: hsl(90 100% 63%)`).
const COLOR_STYLE: RainbowColorStyle = {
  '--color-1': 'hsl(0 100% 63%)',
  '--color-2': 'hsl(270 100% 63%)',
  '--color-3': 'hsl(210 100% 63%)',
  '--color-4': 'hsl(195 100% 63%)',
  '--color-5': 'hsl(90 100% 63%)',
}

export const rainbowButtonVariants = (options?: VariantOptions): string => {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[options?.variant ?? 'default']} ${SIZE_CLASSES[options?.size ?? 'default']}${options?.className ? ` ${options.className}` : ''}`
}

interface RainbowButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | null
  size?: 'default' | 'sm' | 'lg' | 'icon' | null
  asChild?: boolean
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  className?: string
}

export const RainbowButton = (props: RainbowButtonProps) => {
  const [own, rest] = splitProps(props, ['variant', 'size', 'asChild', 'class', 'className'])

  // PORT-NOTE: upstream swaps in Radix's `Slot` when `asChild` is set; Solid
  // has no Slot equivalent, so `asChild` is accepted for API compatibility
  // but always renders a <button>.
  return (
    <>
      <style>{STYLE}</style>
      <button
        {...rest}
        data-slot="button"
        style={COLOR_STYLE}
        class={rainbowButtonVariants({
          variant: own.variant ?? 'default',
          size: own.size ?? 'default',
          className: `${own.class ?? ''} ${own.className ?? ''}`.trim(),
        })}
      />
    </>
  )
}

export default RainbowButton
