// Source: github.com/ibelick/motion-primitives components/core/infinite-slider.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: react-use-measure maps to a ResizeObserver on the sliding track.
// motion/react animate() on a MotionValue maps to vanilla motionValue +
// animate() (same engine; keyframe arrays, repeat, onRepeat behave the same).
// Upstream renders {children}{children} — a Solid JSX node cannot be mounted
// twice, so the duplicate copy is a static DOM cloneNode of the rendered
// children (PORTING.md §3): reactive updates or event listeners inside
// `children` do not propagate to the duplicate. The two copies sit in
// gap-sized flex slots so inter-item spacing (and the cross-copy gap) matches
// upstream's flat gap list exactly.

import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls } from 'motion'

export type InfiniteSliderProps = {
  children: JSX.Element
  gap?: number
  speed?: number
  speedOnHover?: number
  direction?: 'horizontal' | 'vertical'
  reverse?: boolean
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function InfiniteSlider(props: InfiniteSliderProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'gap',
    'speed',
    'speedOnHover',
    'direction',
    'reverse',
    'class',
    'className',
  ])

  const gap = () => own.gap ?? 16
  const speed = () => own.speed ?? 100
  const direction = () => own.direction ?? 'horizontal'
  const reverse = () => own.reverse ?? false

  const [isHovering, setIsHovering] = createSignal(false)
  const [isTransitioning, setIsTransitioning] = createSignal(false)
  const [key, setKey] = createSignal(0)
  const [size, setSize] = createSignal({ width: 0, height: 0 })

  // Upstream useMotionValue(0) driving x/y.
  const translation = motionValue(0)
  const [offset, setOffset] = createSignal(0)
  const changeOff = translation.on('change', v => setOffset(v))

  let track!: HTMLDivElement
  let slotA!: HTMLDivElement
  let controls: AnimationPlaybackControls | undefined

  onMount(() => {
    // Duplicate copy for the seamless loop (static clone — see PORT-NOTE).
    for (const node of Array.from(slotA.childNodes)) {
      track.lastElementChild?.append(node.cloneNode(true))
    }

    const ro = new ResizeObserver(entries => {
      const rect = entries[0].contentRect
      setSize({ width: rect.width, height: rect.height })
    })
    ro.observe(track)
    onCleanup(() => {
      ro.disconnect()
      changeOff()
      controls?.stop()
    })
  })

  const flexDirection = () => (direction() === 'horizontal' ? 'row' : 'column')

  // Upstream's animation effect, keyed on [key, translation, currentSpeed,
  // width, height, gap, isTransitioning, direction, reverse].
  createEffect(() => {
    key() // restarts the loop after a hover transition completes
    const { width, height } = size()
    const g = gap()
    const dir = direction()
    const rev = reverse()
    const transitioning = isTransitioning()
    const currentSpeed = isHovering() && own.speedOnHover ? own.speedOnHover : speed()

    const contentDimension = dir === 'horizontal' ? width : height
    const contentSize = contentDimension + g
    const from = rev ? -contentSize / 2 : 0
    const to = rev ? 0 : -contentSize / 2

    const distanceToTravel = Math.abs(to - from)
    const duration = distanceToTravel / currentSpeed

    if (transitioning) {
      const remainingDistance = Math.abs(translation.get() - to)
      const transitionDuration = remainingDistance / currentSpeed

      controls = animate(translation, [translation.get(), to], {
        ease: 'linear',
        duration: transitionDuration,
        onComplete: () => {
          setIsTransitioning(false)
          setKey(prev => prev + 1)
        },
      })
    } else {
      controls = animate(translation, [from, to], {
        ease: 'linear',
        duration,
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay: 0,
        onRepeat: () => {
          translation.set(from)
        },
      })
    }

    onCleanup(() => controls?.stop())
  })

  const onHoverStart = () => {
    setIsTransitioning(true)
    setIsHovering(true)
  }
  const onHoverEnd = () => {
    setIsTransitioning(true)
    setIsHovering(false)
  }

  return (
    <div
      {...(rest as unknown as JSX.HTMLAttributes<HTMLDivElement>)}
      class={`overflow-hidden ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <div
        ref={track}
        class="flex w-max"
        style={{
          gap: `${gap()}px`,
          'flex-direction': flexDirection(),
          transform:
            direction() === 'horizontal'
              ? `translateX(${offset()}px)`
              : `translateY(${offset()}px)`,
        }}
        onMouseEnter={own.speedOnHover !== undefined ? onHoverStart : undefined}
        onMouseLeave={own.speedOnHover !== undefined ? onHoverEnd : undefined}
      >
        <div
          ref={slotA}
          class="flex"
          style={{ gap: `${gap()}px`, 'flex-direction': flexDirection() }}
        >
          {props.children}
        </div>
        <div
          aria-hidden="true"
          class="flex"
          style={{ gap: `${gap()}px`, 'flex-direction': flexDirection() }}
        />
      </div>
    </div>
  )
}

export default InfiniteSlider
