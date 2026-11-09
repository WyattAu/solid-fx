// Source: github.com/ibelick/motion-primitives components/core/tilt.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream composes rotateX/rotateY through useTransform +
// useMotionTemplate and drives them via useSpring; here the springs are
// motion animate() calls re-anchored on pointer events (PORTING.md §5,
// Magnetic precedent) and the clamped rotation mapping (framer's useTransform
// clamps input by default) is applied inside the transform writer.
// PORT-NOTE: upstream `style` is MotionStyle (motion values allowed); the
// port accepts plain JSX.CSSProperties only.

import type { AnimationPlaybackControls, SpringOptions } from 'motion'
import { animate, motionValue } from 'motion'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'

export type TiltProps = {
  children?: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
  rotationFactor?: number
  /** Upstream prop name preserved verbatim (including the typo). */
  isRevese?: boolean
  springOptions?: SpringOptions
}

export function Tilt(props: TiltProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'style',
    'rotationFactor',
    'isRevese',
    'springOptions',
  ])

  let el!: HTMLDivElement

  const x = motionValue(0)
  const y = motionValue(0)
  let springX: AnimationPlaybackControls | undefined
  let springY: AnimationPlaybackControls | undefined

  // Upstream useTransform mapping [-0.5, 0.5] → per-axis degree ranges,
  // clamped like framer's useTransform default so spring overshoot saturates.
  const clampMap = (v: number, outLow: number, outHigh: number): number => {
    const t = Math.min(0.5, Math.max(-0.5, v))
    return outLow + (t + 0.5) * (outHigh - outLow)
  }

  const apply = () => {
    const rf = own.rotationFactor ?? 15
    const reverse = own.isRevese ?? false
    const rotateX = clampMap(y.get(), reverse ? rf : -rf, reverse ? -rf : rf)
    const rotateY = clampMap(x.get(), reverse ? -rf : rf, reverse ? rf : -rf)
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const springTo = (targetX: number, targetY: number) => {
    const options = { type: 'spring' as const, ...(own.springOptions ?? {}) }
    springX?.stop()
    springY?.stop()
    springX = animate(x, targetX, options)
    springY = animate(y, targetY, options)
  }

  onMount(() => {
    apply()
    const offs = [x.on('change', apply), y.on('change', apply)]
    onCleanup(() => {
      offs.forEach(off => {
        off()
      })
      springX?.stop()
      springY?.stop()
    })
  })

  return (
    <div
      {...rest}
      ref={el}
      onMouseMove={(e: MouseEvent) => {
        const rect = el.getBoundingClientRect()
        const xPos = (e.clientX - rect.left) / rect.width - 0.5
        const yPos = (e.clientY - rect.top) / rect.height - 0.5
        springTo(xPos, yPos)
      }}
      onMouseLeave={() => springTo(0, 0)}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
      style={{ 'transform-style': 'preserve-3d', ...own.style }}
    >
      {own.children}
    </div>
  )
}

export default Tilt
