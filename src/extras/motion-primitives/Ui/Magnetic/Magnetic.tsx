// Source: github.com/ibelick/motion-primitives components/core/magnetic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.

import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls, SpringOptions } from 'motion'

const SPRING_CONFIG: SpringOptions = { stiffness: 26.7, damping: 4.1, mass: 0.2 }

export type MagneticProps = {
  children?: JSX.Element
  intensity?: number
  range?: number
  actionArea?: 'self' | 'parent' | 'global'
  springOptions?: SpringOptions
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function Magnetic(props: MagneticProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'intensity',
    'range',
    'actionArea',
    'springOptions',
    'class',
    'className',
  ])

  const [isHovered, setIsHovered] = createSignal(false)
  let rootEl!: HTMLDivElement

  // PORT-NOTE: upstream useMotionValue + useSpring (React layer) is ported to
  // vanilla motionValues retargeted by spring animate() calls per
  // PORTING.md §5 — motion's spring engine drives the same physics as
  // useSpring, re-anchoring on every target change.
  const x = motionValue(0)
  const y = motionValue(0)
  let springX: AnimationPlaybackControls | undefined
  let springY: AnimationPlaybackControls | undefined

  const actionArea = () => own.actionArea ?? 'self'
  const intensity = () => own.intensity ?? 0.6
  const range = () => own.range ?? 100

  const springTo = (targetX: number, targetY: number) => {
    const options = { type: 'spring' as const, ...(own.springOptions ?? SPRING_CONFIG) }
    springX?.stop()
    springY?.stop()
    springX = animate(x, targetX, options)
    springY = animate(y, targetY, options)
  }

  onMount(() => {
    // Upstream: document-level mousemove drives the magnetic pull; its effect
    // re-created the handler on [isHovered, intensity, range] — here those are
    // read at event time instead.
    const calculateDistance = (e: MouseEvent) => {
      const el = rootEl
      if (!el) return
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY

      const absoluteDistance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

      if (isHovered() && absoluteDistance <= range()) {
        const scale = 1 - absoluteDistance / range()
        springTo(distanceX * intensity() * scale, distanceY * intensity() * scale)
      } else {
        springTo(0, 0)
      }
    }
    document.addEventListener('mousemove', calculateDistance)

    // Upstream: style={{ x: springX, y: springY }} — applied manually since
    // vanilla motion values don't bind to the DOM on their own.
    const apply = () => {
      rootEl.style.transform = `translate3d(${x.get()}px, ${y.get()}px, 0)`
    }
    apply()
    const offs = [x.on('change', apply), y.on('change', apply)]

    onCleanup(() => {
      document.removeEventListener('mousemove', calculateDistance)
      offs.forEach(off => off())
      springX?.stop()
      springY?.stop()
    })
  })

  // Upstream: useEffect on [actionArea] — hover detection surface.
  createEffect(() => {
    const area = actionArea()
    if (area === 'parent' && rootEl?.parentElement) {
      const parent = rootEl.parentElement

      const handleParentEnter = () => setIsHovered(true)
      const handleParentLeave = () => setIsHovered(false)

      parent.addEventListener('mouseenter', handleParentEnter)
      parent.addEventListener('mouseleave', handleParentLeave)

      onCleanup(() => {
        parent.removeEventListener('mouseenter', handleParentEnter)
        parent.removeEventListener('mouseleave', handleParentLeave)
      })
    } else if (area === 'global') {
      setIsHovered(true)
    }
  })

  return (
    <div
      {...rest}
      ref={rootEl}
      onMouseEnter={() => {
        if (actionArea() === 'self') setIsHovered(true)
      }}
      onMouseLeave={() => {
        if (actionArea() === 'self') {
          setIsHovered(false)
          // Upstream sets the raw values and lets the attached spring glide
          // back; the equivalent here is springing to origin.
          springTo(0, 0)
        }
      }}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children}
    </div>
  )
}

export default Magnetic
