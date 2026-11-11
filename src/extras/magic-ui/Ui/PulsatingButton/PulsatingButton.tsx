// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/pulsating-button.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { createEffect, onCleanup, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface PulsatingButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
  pulseColor?: string
  duration?: string
  distance?: string
  variant?: 'pulse' | 'ripple'
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  /** Imperative element ref (forwardRef parity). */
  ref?: (el: HTMLButtonElement) => void
}

// PORT-NOTE: upstream ships both pulse animations through the Tailwind theme
// (`--animate-pulse: pulse var(--duration) ease-out infinite` and
// `--animate-pulse-ripple: pulse-ripple var(--duration)
// cubic-bezier(0.16, 1, 0.3, 1) infinite` plus their keyframes in the registry
// globals.css). Embedded here so the port is self-contained without touching
// the site's Tailwind theme. Upstream's `variant="pulse"` reuses Tailwind's
// `animate-pulse` utility name (their theme replaces the keyframes); shipping
// a `.animate-pulse` override here would globally redefine Tailwind's built-in
// utility for the whole site, so the pulse animation ships as
// `magic-pulse` instead — same keyframes, same timing.
const STYLE = `
@keyframes magic-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--pulse-color, oklch(from var(--bg) l c h / 0.5));
  }
  50% {
    box-shadow: 0 0 0 var(--distance) var(--pulse-color, oklch(from var(--bg) l c h / 0.5));
  }
}
.animate-magic-pulse {
  animation: magic-pulse var(--duration, 1.5s) ease-out infinite;
}
@keyframes pulse-ripple {
  0% {
    box-shadow: 0 0 0 0 oklch(from var(--pulse-color, var(--bg)) l c h / 1);
  }
  100% {
    box-shadow: 0 0 0 var(--distance) oklch(from var(--pulse-color, var(--bg)) l c h / 0);
  }
}
.animate-pulse-ripple {
  animation: pulse-ripple var(--duration, 1.5s) cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
`

export const PulsatingButton = (props: PulsatingButtonProps) => {
  const [own, rest] = splitProps(props, [
    'pulseColor',
    'duration',
    'distance',
    'variant',
    'class',
    'className',
    'children',
    'ref',
  ])

  const duration = () => own.duration ?? '1.5s'
  const distance = () => own.distance ?? '8px'
  const variant = () => own.variant ?? 'pulse'

  let buttonEl!: HTMLButtonElement

  // Upstream: useLayoutEffect on [pulseColor] — keep `--bg` in sync with the
  // button's resolved background-color so the pulse ring follows theme changes.
  // Solid: reads become accessor calls so the effect re-runs on pulseColor
  // changes; onCleanup tears down observers/listeners before each re-run.
  createEffect(() => {
    const button = buttonEl
    if (!button) return

    if (own.pulseColor) {
      button.style.removeProperty('--bg')
      return
    }

    let animationFrameId = 0
    let currentBg = ''

    const updateBg = () => {
      animationFrameId = 0

      const nextBg = getComputedStyle(button).backgroundColor
      if (nextBg === currentBg) return

      currentBg = nextBg
      button.style.setProperty('--bg', nextBg)
    }

    const scheduleBgUpdate = () => {
      if (animationFrameId) return
      animationFrameId = window.requestAnimationFrame(updateBg)
    }

    updateBg()

    const themeObserver = new MutationObserver(scheduleBgUpdate)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    const buttonObserver = new MutationObserver(scheduleBgUpdate)
    buttonObserver.observe(button, {
      attributes: true,
    })

    const syncEvents = ['blur', 'focus', 'pointerenter', 'pointerleave'] as const

    for (const eventName of syncEvents) {
      button.addEventListener(eventName, scheduleBgUpdate)
    }

    onCleanup(() => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }

      themeObserver.disconnect()
      buttonObserver.disconnect()

      for (const eventName of syncEvents) {
        button.removeEventListener(eventName, scheduleBgUpdate)
      }
    })
  })

  return (
    <>
      <style>{STYLE}</style>
      <button
        ref={el => {
          buttonEl = el
          own.ref?.(el)
        }}
        class={`bg-primary text-primary-foreground relative flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-center ${own.class ?? ''} ${own.className ?? ''}`}
        style={
          {
            ...(own.pulseColor && { '--pulse-color': own.pulseColor }),
            '--duration': duration(),
            '--distance': distance(),
          } as JSX.CSSProperties
        }
        {...rest}
      >
        <span class="relative z-10">{own.children}</span>
        <span
          aria-hidden="true"
          class={`pointer-events-none absolute inset-0 rounded-[inherit] bg-inherit ${variant() === 'pulse' ? 'animate-magic-pulse' : 'animate-pulse-ripple'}`}
        />
      </button>
    </>
  )
}

export default PulsatingButton
