// Built with Lenis (github.com/darkroomengineering/lenis) — MIT. Smooth scroll engine pilot per EXTRAS-ROADMAP.md.
import { onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import Lenis from 'lenis'
import type { Orientation } from 'lenis'

interface SmoothScrollProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** React parity alias; merges with `class`. */
  className?: string
  /**
   * Linear interpolation intensity (0–1). Lower values scroll smoother and
   * trail the input longer. Mutually exclusive with `duration` in Lenis —
   * pass one, not both.
   * @default 0.1 (Lenis built-in)
   */
  lerp?: number
  /**
   * Scroll duration in seconds (fixed-duration easing; takes precedence over
   * `lerp` when both are set).
   */
  duration?: number
  /**
   * Whether to smooth the scroll initiated by `wheel` events.
   * @default true
   */
  smoothWheel?: boolean
  /**
   * The orientation of the scrolling.
   * @default 'vertical'
   */
  orientation?: Orientation
  /**
   * Container element to smooth-scroll instead of the window. Must be a
   * scroll container (constrained height + overflow) whose first element
   * child holds the content.
   */
  wrapper?: HTMLElement
}

// PORT-NOTE: Lenis expects its stylesheet classes on the wrapper (document
// height, scroll-behavior override, stopped-state overflow). The rules are
// embedded here so the port is self-contained without importing
// 'lenis/dist/lenis.css' — same pattern as Marquee's embedded keyframes.
const STYLE = `
html.lenis,
html.lenis body {
  height: auto;
}
.lenis:not(.lenis-autoToggle).lenis-stopped {
  overflow: clip;
}
.lenis [data-lenis-prevent],
.lenis [data-lenis-prevent-wheel],
.lenis [data-lenis-prevent-touch],
.lenis [data-lenis-prevent-vertical],
.lenis [data-lenis-prevent-horizontal] {
  overscroll-behavior: contain;
}
.lenis.lenis-smooth iframe {
  pointer-events: none;
}
.lenis.lenis-autoToggle {
  transition-property: overflow;
  transition-duration: 1ms;
  transition-behavior: allow-discrete;
}
`

export function SmoothScroll(props: SmoothScrollProps) {
  const [own, rest] = splitProps(props, [
    'class',
    'className',
    'style',
    'children',
    'lerp',
    'duration',
    'smoothWheel',
    'orientation',
    'wrapper',
  ])

  // PORT-NOTE: Lenis options are read once at mount — the engine has no
  // reactive options API. Reduced-motion users are honored by Lenis itself
  // (`respectReducedMotion` defaults to true: smoothing off, instant jumps).
  onMount(() => {
    const el = own.wrapper
    const lenis = new Lenis({
      autoRaf: true,
      wrapper: el, // undefined → Lenis defaults to the window
      content: el ? (el.firstElementChild ?? el) : undefined,
      lerp: own.lerp,
      duration: own.duration,
      smoothWheel: own.smoothWheel,
      orientation: own.orientation,
    })
    // Lenis owns the document scroll — a missed destroy breaks the page,
    // so disposal is non-negotiable (EXTRAS-ROADMAP.md).
    onCleanup(() => lenis.destroy())
  })

  return (
    <div {...rest} class={`${own.class ?? ''} ${own.className ?? ''}`} style={own.style}>
      <style>{STYLE}</style>
      {own.children}
    </div>
  )
}

export default SmoothScroll
