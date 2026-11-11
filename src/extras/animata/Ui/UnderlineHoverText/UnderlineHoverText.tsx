// Source: github.com/codse/animata animata/text/underline-hover-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream merges classes with cn() (clsx + tailwind-merge); this
// port template-joins, equivalent for the plain strings passed here.
interface UnderlineHoverTextProps {
  text: string
  /**
   * Resting text color. Tailwind class string.
   */
  textColor?: string
  /**
   * Text color applied on hover. Pass `hover:text-foo` style class, or leave
   * empty to keep the resting color.
   */
  hoverTextColor?: string
  /**
   * Background color class applied to the underline stroke. Pass a plain
   * class like `bg-zinc-900` (or any `bg-*`). The component drives visibility
   * itself via the parent's `:hover` — if you pass a `hover:`-prefixed class
   * here it'll never apply (the stroke element is not the hovered element)
   * and the stroke will appear colorless on hover.
   */
  hoverColor?: string
  fontSize?: string
  fontWeight?: string
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export default function UnderlineHoverText(props: UnderlineHoverTextProps) {
  const textColor = () => props.textColor ?? 'text-zinc-900 dark:text-zinc-100'
  const hoverColor = () => props.hoverColor ?? 'bg-zinc-900 dark:bg-zinc-100'
  const fontSize = () => props.fontSize ?? 'text-2xl'
  const fontWeight = () => props.fontWeight ?? 'font-medium'

  return (
    <span
      class={`group/underline relative inline-block cursor-pointer px-1 pb-1.5 tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-[2px] ${fontSize()} ${textColor()} ${fontWeight()} ${
        props.hoverTextColor ?? ''
      } ${props.class ?? ''} ${props.className ?? ''}`}
    >
      <span class="relative z-10">{props.text}</span>
      {/* Soft baseline — always present, muted */}
      <span
        aria-hidden
        class="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-current opacity-25"
      />
      {/* Hover stroke — sweeps outward from the center */}
      <span
        aria-hidden
        class={`pointer-events-none absolute -bottom-px left-1/2 h-[3px] w-0 -translate-x-1/2 rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/underline:w-full ${hoverColor()}`}
      />
    </span>
  )
}
