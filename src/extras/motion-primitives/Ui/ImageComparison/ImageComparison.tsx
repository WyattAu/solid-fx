// Source: github.com/ibelick/motion-primitives components/core/image-comparison.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream useSpring + useTransform (clip-path / left) chains are
// ported to a vanilla motionValue subscribed by the image and slider
// elements, which write their styles directly on change (PORTING.md §5).
// The React context value carries Solid accessors plus the raw motionValue.

import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls, MotionValue, SpringOptions } from 'motion'
import { createContext, createSignal, onCleanup, onMount, splitProps, useContext } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

type ImageComparisonContextValue = {
  sliderPosition: Accessor<number>
  setSliderPosition: (pos: number) => void
  motionSliderPosition: MotionValue<number>
}

const ImageComparisonContext = createContext<ImageComparisonContextValue>()

function useImageComparison() {
  const context = useContext(ImageComparisonContext)
  if (!context) {
    throw new Error('useImageComparison must be used within an ImageComparison component')
  }
  return context
}

export type ImageComparisonProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  enableHover?: boolean
  springOptions?: SpringOptions
}

const DEFAULT_SPRING_OPTIONS: SpringOptions = {
  bounce: 0,
  duration: 0,
}

export function ImageComparison(props: ImageComparisonProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'enableHover',
    'springOptions',
  ])

  const [isDragging, setIsDragging] = createSignal(false)
  const sliderMv = motionValue(50)
  const motionSliderPosition = motionValue(50)
  const [sliderPosition, setSliderPosition] = createSignal(50)
  let spring: AnimationPlaybackControls | undefined

  // Upstream: useSpring follows the raw motionValue; the equivalent here is
  // a spring animate() re-anchored on every target change (Magnetic
  // precedent). With the default { bounce: 0, duration: 0 } it is an
  // instant follow, matching upstream.
  onMount(() => {
    const off = sliderMv.on('change', v => {
      spring?.stop()
      spring = animate(motionSliderPosition, v, own.springOptions ?? DEFAULT_SPRING_OPTIONS)
    })
    onCleanup(() => {
      off()
      spring?.stop()
    })
  })

  const handleDrag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging() && !own.enableHover) return

    const target = event.currentTarget as HTMLElement | null
    if (!target) return
    const containerRect = target.getBoundingClientRect()
    const x =
      'touches' in event
        ? event.touches[0].clientX - containerRect.left
        : (event as MouseEvent).clientX - containerRect.left

    const percentage = Math.min(Math.max((x / containerRect.width) * 100, 0), 100)
    sliderMv.set(percentage)
    setSliderPosition(percentage)
  }

  return (
    <ImageComparisonContext.Provider
      value={{ sliderPosition, setSliderPosition, motionSliderPosition }}
    >
      <div
        {...rest}
        class={`relative select-none overflow-hidden ${own.enableHover ? 'cursor-ew-resize' : ''} ${own.class ?? ''} ${own.className ?? ''}`}
        onMouseMove={handleDrag}
        onMouseDown={() => {
          if (!own.enableHover) setIsDragging(true)
        }}
        onMouseUp={() => {
          if (!own.enableHover) setIsDragging(false)
        }}
        onMouseLeave={() => {
          if (!own.enableHover) setIsDragging(false)
        }}
        onTouchMove={handleDrag}
        onTouchStart={() => {
          if (!own.enableHover) setIsDragging(true)
        }}
        onTouchEnd={() => {
          if (!own.enableHover) setIsDragging(false)
        }}
      >
        {own.children}
      </div>
    </ImageComparisonContext.Provider>
  )
}

export type ImageComparisonImageProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  alt: string
  src: string
  position: 'left' | 'right'
}

export function ImageComparisonImage(props: ImageComparisonImageProps) {
  const ctx = useImageComparison()

  const clipPath = (value: number) =>
    props.position === 'left' ? `inset(0 0 0 ${value}%)` : `inset(0 ${100 - value}% 0 0)`

  let el!: HTMLImageElement
  onMount(() => {
    const apply = () => {
      el.style.clipPath = clipPath(ctx.motionSliderPosition.get())
    }
    apply()
    const off = ctx.motionSliderPosition.on('change', apply)
    onCleanup(off)
  })

  return (
    <img
      ref={el}
      src={props.src}
      alt={props.alt}
      class={`absolute inset-0 h-full w-full object-cover ${props.class ?? ''} ${props.className ?? ''}`}
    />
  )
}

export type ImageComparisonSliderProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  children?: JSX.Element
}

export function ImageComparisonSlider(props: ImageComparisonSliderProps) {
  const ctx = useImageComparison()

  let el!: HTMLDivElement
  onMount(() => {
    const apply = () => {
      el.style.left = `${ctx.motionSliderPosition.get()}%`
    }
    apply()
    const off = ctx.motionSliderPosition.on('change', apply)
    onCleanup(off)
  })

  return (
    <div
      ref={el}
      class={`absolute top-0 bottom-0 w-1 cursor-ew-resize ${props.class ?? ''} ${props.className ?? ''}`}
    >
      {props.children}
    </div>
  )
}

export default ImageComparison
