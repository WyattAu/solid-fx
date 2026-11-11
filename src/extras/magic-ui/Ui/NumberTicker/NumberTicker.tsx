// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/number-ticker.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface NumberTickerProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'ref'> {
  value: number
  startValue?: number
  direction?: 'up' | 'down'
  delay?: number
  decimalPlaces?: number
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  /** Imperative element ref (forwardRef parity). */
  ref?: (el: HTMLSpanElement) => void
}

/**
 * NumberTicker
 *
 * An odometer-style number that springs from `startValue` to `value` when it
 * scrolls into view.
 *
 * PORT-NOTE: upstream builds the roll on `useSpring` from motion/react; the
 * vanilla `motion` package has no spring source, so the spring runs as a
 * semi-implicit Euler integrator (stiffness 100, damping 60, mass 1 — same
 * constants) in a rAF loop that parks itself once the value settles.
 */
export const NumberTicker = (props: NumberTickerProps) => {
  const [own, rest] = splitProps(props, [
    'value',
    'startValue',
    'direction',
    'delay',
    'decimalPlaces',
    'class',
    'className',
    'ref',
  ])

  const startValue = () => own.startValue ?? 0
  const direction = () => own.direction ?? 'up'
  const delay = () => own.delay ?? 0
  const decimalPlaces = () => own.decimalPlaces ?? 0

  let refEl!: HTMLSpanElement

  // Upstream: useMotionValue(direction === 'down' ? value : startValue)
  const [motionValue, setMotionValue] = createSignal(
    direction() === 'down' ? props.value : startValue(),
  )

  // Upstream: useSpring(motionValue, { damping: 60, stiffness: 100 })
  const STIFFNESS = 100
  const DAMPING = 60
  const MASS = 1
  const STEP = 1 / 60

  const spring = { x: motionValue(), v: 0, target: motionValue() }
  let rafId: number | null = null
  let lastTime: number | null = null

  const tick = (now: number) => {
    if (lastTime === null) lastTime = now
    let dt = (now - lastTime) / 1000
    lastTime = now
    // Clamp tab-throttle spikes so the integrator stays stable.
    if (dt > 0.25) dt = 0.25
    while (dt > 0) {
      const h = Math.min(STEP, dt)
      dt -= h
      const a = (-STIFFNESS * (spring.x - spring.target) - DAMPING * spring.v) / MASS
      spring.v += a * h
      spring.x += spring.v * h
    }
    setMotionValue(spring.x)
    if (Math.abs(spring.x - spring.target) < 0.0005 && Math.abs(spring.v) < 0.0005) {
      spring.x = spring.target
      spring.v = 0
      setMotionValue(spring.target)
      rafId = null
      lastTime = null
      return
    }
    rafId = requestAnimationFrame(tick)
  }

  const setSpringTarget = (target: number) => {
    spring.target = target
    if (rafId === null) {
      lastTime = null
      rafId = requestAnimationFrame(tick)
    }
  }

  onCleanup(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  // Upstream: springValue.on('change') writes the formatted number into the
  // span. Solid: an effect over the motion value + decimalPlaces.
  createEffect(() => {
    const el = refEl
    if (!el) return
    const places = decimalPlaces()
    el.textContent = Intl.NumberFormat('en-US', {
      minimumFractionDigits: places,
      maximumFractionDigits: places,
    }).format(Number(motionValue().toFixed(places)))
  })

  // Upstream: useInView(ref, { once: true, margin: '0px' })
  const [isInView, setIsInView] = createSignal(false)

  onMount(() => {
    const el = refEl
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px' },
    )
    observer.observe(el)
    onCleanup(() => observer.disconnect())
  })

  // Upstream: useEffect on [isInView, delay, value, direction, startValue] —
  // schedule the spring start after the optional delay.
  createEffect(() => {
    const target = direction() === 'down' ? startValue() : props.value
    const ms = delay() * 1000
    if (!isInView()) return
    const timer = setTimeout(() => setSpringTarget(target), ms)
    onCleanup(() => clearTimeout(timer))
  })

  return (
    <span
      ref={el => {
        refEl = el
        own.ref?.(el)
      }}
      class={`inline-block tracking-wider text-black tabular-nums dark:text-white ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    >
      {startValue()}
    </span>
  )
}

export default NumberTicker
