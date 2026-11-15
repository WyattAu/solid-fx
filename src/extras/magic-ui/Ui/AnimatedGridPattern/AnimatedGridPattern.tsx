// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/animated-grid-pattern.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.

import type { JSX } from 'solid-js'
import type { AnimationPlaybackControls, DOMKeyframesDefinition } from 'motion'
import { animate } from 'motion'
import {
  createEffect,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js'

interface AnimatedSquareProps {
  square: { id: number; pos: [number, number]; iteration: number }
  /** Position of the square in the grid (drives the stagger delay). */
  index: number
  width: number
  height: number
  maxOpacity: number
  duration: number
  repeatDelay: number
  onComplete: (squareId: number) => void
}

// Upstream renders a keyed <motion.rect> that fades 0 → maxOpacity → 0
// (`repeat: 1, repeatType: "reverse"`) and repositions on animation complete.
// PORT-NOTE: modeled as [0, max, 0] keyframes over 2× duration; the
// repeatDelay is folded into the completion timeout that re-positions the
// square (upstream: onAnimationComplete + key `${id}-${iteration}` remount).
const AnimatedSquare = (props: AnimatedSquareProps) => {
  let el!: SVGRectElement

  createEffect(() => {
    const square = props.square
    // PORT-NOTE: motion's animate() overload for SVG elements
    // (ObjectTarget<SVGRectElement>) types only SVG attributes — CSS
    // properties like opacity are rejected. Route through the HTMLElement
    // overload, which accepts the full DOMKeyframesDefinition (same pattern
    // as motion-primitives TextAnimate); runtime path is identical (WAAPI on
    // the Element).
    const target = el as unknown as HTMLElement
    const keyframes: DOMKeyframesDefinition = { opacity: [0, props.maxOpacity, 0] }
    const controls: AnimationPlaybackControls = animate(target, keyframes, {
      duration: props.duration * 2,
      delay: props.index * 0.1,
      ease: 'easeInOut',
    })
    const timeout = setTimeout(
      () => props.onComplete(square.id),
      (props.index * 0.1 + props.duration * 2 + props.repeatDelay) * 1000,
    )
    onCleanup(() => {
      controls.stop()
      clearTimeout(timeout)
    })
  })

  return (
    <rect
      ref={el}
      width={props.width - 1}
      height={props.height - 1}
      x={props.square.pos[0] * props.width + 1}
      y={props.square.pos[1] * props.height + 1}
      fill="currentColor"
      stroke-width="0"
    />
  )
}

export interface AnimatedGridPatternProps extends JSX.GSVGAttributes<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  strokeDasharray?: number
  numSquares?: number
  maxOpacity?: number
  duration?: number
  repeatDelay?: number
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  className?: string
}

type Square = {
  id: number
  pos: [number, number]
  iteration: number
}

export const AnimatedGridPattern = (props: AnimatedGridPatternProps) => {
  const [own, rest] = splitProps(props, [
    'width',
    'height',
    'x',
    'y',
    'strokeDasharray',
    'numSquares',
    'maxOpacity',
    'duration',
    'repeatDelay',
    'class',
    'className',
  ])

  const width = () => own.width ?? 40
  const height = () => own.height ?? 40
  const x = () => own.x ?? -1
  const y = () => own.y ?? -1
  const strokeDasharray = () => own.strokeDasharray ?? 0
  const numSquares = () => own.numSquares ?? 50
  const maxOpacity = () => own.maxOpacity ?? 0.5
  const duration = () => own.duration ?? 4
  const repeatDelay = () => own.repeatDelay ?? 0.5

  const id = createUniqueId()
  let containerEl!: SVGSVGElement
  const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 })
  const [squares, setSquares] = createSignal<Square[]>([])

  const getPos = (): [number, number] => {
    return [
      Math.floor((Math.random() * dimensions().width) / width()),
      Math.floor((Math.random() * dimensions().height) / height()),
    ]
  }

  const generateSquares = (count: number): Square[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      pos: getPos(),
      iteration: 0,
    }))
  }

  const updateSquarePosition = (squareId: number) => {
    setSquares(currentSquares => {
      const current = currentSquares[squareId]
      if (!current || current.id !== squareId) return currentSquares

      const nextSquares = currentSquares.slice()
      nextSquares[squareId] = {
        ...current,
        pos: getPos(),
        iteration: current.iteration + 1,
      }

      return nextSquares
    })
  }

  // Upstream useEffect on [dimensions, generateSquares, numSquares].
  createEffect(() => {
    if (dimensions().width && dimensions().height) {
      setSquares(generateSquares(numSquares()))
    }
  })

  onMount(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions(currentDimensions => {
          const nextWidth = entry.contentRect.width
          const nextHeight = entry.contentRect.height
          if (currentDimensions.width === nextWidth && currentDimensions.height === nextHeight) {
            return currentDimensions
          }
          return { width: nextWidth, height: nextHeight }
        })
      }
    })

    resizeObserver.observe(containerEl)
    onCleanup(() => resizeObserver.disconnect())
  })

  return (
    <svg
      {...rest}
      ref={containerEl}
      aria-hidden="true"
      class={`pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30 ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <defs>
        <pattern
          id={id}
          width={width()}
          height={height()}
          patternUnits="userSpaceOnUse"
          x={x()}
          y={y()}
        >
          <path
            d={`M.5 ${height()}V.5H${width()}`}
            fill="none"
            stroke-dasharray={String(strokeDasharray())}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <svg x={x()} y={y()} class="overflow-visible">
        <For each={squares()}>
          {(square, index) => (
            <AnimatedSquare
              square={square}
              index={index()}
              width={width()}
              height={height()}
              maxOpacity={maxOpacity()}
              duration={duration()}
              repeatDelay={repeatDelay()}
              onComplete={updateSquarePosition}
            />
          )}
        </For>
      </svg>
    </svg>
  )
}

export default AnimatedGridPattern
