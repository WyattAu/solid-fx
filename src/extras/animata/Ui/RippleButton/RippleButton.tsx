// Source: github.com/codse/animata animata/button/ripple-button.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream imports ./ripple-button.css; the stylesheet is inlined
// in an enclosing <style> element (component-scoped keyframes can't ship as
// Tailwind classes). React refs map to Solid `let` refs; the hover flag is a
// plain closure variable. PORT-NOTE: the transient `animationend` listener
// started in removeRipple is additionally registered with onCleanup so it is
// dropped if the button unmounts mid-animation. `font-jost` is an
// upstream-site-only Tailwind font utility — kept for parity, it falls back
// to the inherited font when absent. Caller props spread last, matching
// upstream's `{...props}` ordering (caller handlers win).
import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'

interface RippleButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  /** React parity alias; merges with `class`. */
  className?: string
}

const rippleStyles = `
.ripple {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  background-color: #000000;
  z-index: 1;
  opacity: 0;
  transition: transform 50ms linear;
}

.ripple-enter {
  animation: ripple-enter 250ms ease-out forwards;
}

.ripple-leave {
  animation: ripple-leave 250ms ease-out forwards;
}

@keyframes ripple-enter {
  from {
    transform: scale(0);
    opacity: 1;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes ripple-leave {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0);
    opacity: 1;
  }
}
`

export default function RippleButton(props: RippleButtonProps) {
  const [own, rest] = splitProps(props, ['children', 'class', 'className'])

  let buttonEl!: HTMLButtonElement
  let rippleEl!: HTMLSpanElement
  let isHovered = false
  let cleanupAnimEnd: (() => void) | undefined

  const createRipple = (event: MouseEvent) => {
    if (isHovered || !buttonEl || !rippleEl) return
    isHovered = true

    const rect = buttonEl.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    rippleEl.style.width = `${size}px`
    rippleEl.style.height = `${size}px`
    rippleEl.style.left = `${x}px`
    rippleEl.style.top = `${y}px`

    rippleEl.classList.remove('ripple-leave')
    rippleEl.classList.add('ripple-enter')
  }

  const removeRipple = (event: MouseEvent) => {
    if (event.target !== event.currentTarget) return
    if (!buttonEl || !rippleEl) return
    isHovered = false

    const rect = buttonEl.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    rippleEl.style.left = `${x}px`
    rippleEl.style.top = `${y}px`

    rippleEl.classList.remove('ripple-enter')
    rippleEl.classList.add('ripple-leave')

    const handleAnimationEnd = () => {
      rippleEl.classList.remove('ripple-leave')
      rippleEl.removeEventListener('animationend', handleAnimationEnd)
      cleanupAnimEnd = undefined
    }

    rippleEl.addEventListener('animationend', handleAnimationEnd)
    cleanupAnimEnd = () => rippleEl.removeEventListener('animationend', handleAnimationEnd)
  }

  onCleanup(() => cleanupAnimEnd?.())

  const handleMouseMove = (event: MouseEvent) => {
    if (!buttonEl || !rippleEl || !isHovered) return

    const rect = buttonEl.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    rippleEl.style.left = `${x}px`
    rippleEl.style.top = `${y}px`
  }

  return (
    <>
      <style>{rippleStyles}</style>
      <button
        type="button"
        ref={buttonEl}
        class={`font-jost duration-[300ms] relative flex items-center justify-center overflow-hidden rounded-full bg-[#cbfe7e] p-[1.3rem] text-[1.2rem] font-medium text-[#0e352e] transition-colors hover:text-white ${own.class ?? ''} ${own.className ?? ''}`}
        onMouseEnter={(e: MouseEvent) => {
          if (e.target === e.currentTarget) {
            createRipple(e)
          }
        }}
        onMouseLeave={(e: MouseEvent) => {
          if (e.target === e.currentTarget) {
            removeRipple(e)
          }
        }}
        onMouseMove={handleMouseMove}
        {...rest}
      >
        <span class="relative z-[2]">{own.children}</span>
        <span ref={rippleEl} class="ripple" />
      </button>
    </>
  )
}
