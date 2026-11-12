// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/lens.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
// Backfill: ibelick/motion-primitives @120f64f6 ships no lens.tsx (verified
// against the components tree; this batch needed 4 more components).
// PORT-NOTE: useMotionTemplate maskImage maps to a memoized radial-gradient
// string. AnimatePresence (popLayout) exit is sequenced manually: the lens
// layer runs its exit animation, then unmounts on completion (Cursor
// precedent). A Solid JSX node cannot be mounted twice, so the magnified
// layer holds a static DOM cloneNode of the children (InfiniteSlider
// precedent); the base content sits in a `display: contents` wrapper so the
// clone source is unambiguous. `class`/`className` are accepted as a Solid
// parity superset (upstream LensProps carries no className).

import { animate } from 'motion'
import type { AnimationPlaybackControlsWithThen } from 'motion'
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  splitProps,
} from 'solid-js'
import type { JSX } from 'solid-js'

interface Position {
  /** The x coordinate of the lens */
  x: number
  /** The y coordinate of the lens */
  y: number
}

interface LensProps {
  /** The children of the lens */
  children: JSX.Element
  /** The zoom factor of the lens */
  zoomFactor?: number
  /** The size of the lens */
  lensSize?: number
  /** The position of the lens */
  position?: Position
  /** The default position of the lens */
  defaultPosition?: Position
  /** Whether the lens is static */
  isStatic?: boolean
  /** The duration of the animation */
  duration?: number
  /** The color of the lens */
  lensColor?: string
  /** The aria label of the lens */
  ariaLabel?: string
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function Lens(props: LensProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'zoomFactor',
    'lensSize',
    'position',
    'defaultPosition',
    'isStatic',
    'duration',
    'lensColor',
    'ariaLabel',
    'class',
    'className',
  ])

  const zoomFactor = () => own.zoomFactor ?? 1.3
  const lensSize = () => own.lensSize ?? 170
  const duration = () => own.duration ?? 0.1
  const lensColor = () => own.lensColor ?? 'black'
  const ariaLabel = () => own.ariaLabel ?? 'Zoom Area'
  const isStatic = () => own.isStatic ?? false
  const zeroPosition = { x: 0, y: 0 }

  // Upstream throws during render; validated once at mount here.
  onMount(() => {
    if (zoomFactor() < 1) throw new Error('zoomFactor must be greater than 1')
    if (lensSize() < 0) throw new Error('lensSize must be greater than 0')
  })

  const [isHovering, setIsHovering] = createSignal(false)
  // useState(position) — initial value only, no live prop sync upstream.
  const [mousePosition, setMousePosition] = createSignal(own.position ?? zeroPosition)

  const currentPosition = createMemo<Position>(() => {
    if (isStatic()) return own.position ?? zeroPosition
    if (own.defaultPosition && !isHovering()) return own.defaultPosition
    return mousePosition()
  })

  const maskImage = createMemo(() => {
    const p = currentPosition()
    return `radial-gradient(circle ${lensSize() / 2}px at ${p.x}px ${p.y}px, ${lensColor()} 100%, transparent 100%)`
  })

  // AnimatePresence: hovered lens layer mounted/unmounted with exit animation.
  // Static (or default-position) lenses render permanently upstream.
  const [present, setPresent] = createSignal(isStatic() || !!own.defaultPosition)

  createEffect(() => {
    if (isStatic() || own.defaultPosition) return
    if (isHovering()) {
      if (!present()) setPresent(true)
    } else if (present()) {
      exitControls?.stop()
      if (layerEl) {
        exitControls = animate(layerEl, { opacity: 0, scale: 0.8 }, { duration: duration() })
        void exitControls.then(() => {
          if (!isHovering()) setPresent(false)
        })
      } else {
        setPresent(false)
      }
    }
  })

  let baseEl!: HTMLDivElement
  let layerEl: HTMLDivElement | undefined
  let innerEl: HTMLDivElement | undefined
  let enterControls: AnimationPlaybackControlsWithThen | undefined
  let exitControls: AnimationPlaybackControlsWithThen | undefined

  const layerRef = (el: HTMLDivElement) => {
    layerEl = el
    onCleanup(() => {
      enterControls?.stop()
      exitControls?.stop()
      layerEl = undefined
      innerEl = undefined
    })
    // Magnified clone of the children (static clone — see PORT-NOTE).
    if (innerEl) {
      for (const node of Array.from(baseEl.childNodes)) {
        innerEl.append(node.cloneNode(true))
      }
    }
    // initial={{ opacity: 0, scale: 0.58 }} → animate to opacity 1, scale 1.
    el.style.opacity = '0'
    el.style.transform = 'scale(0.58)'
    enterControls?.stop()
    enterControls = animate(el, { opacity: 1, scale: 1 }, { duration: duration() })
  }

  const applyLayerStyles = () => {
    if (!layerEl) return
    const p = currentPosition()
    const origin = `${p.x}px ${p.y}px`
    layerEl.style.maskImage = maskImage()
    layerEl.style.webkitMaskImage = maskImage()
    layerEl.style.transformOrigin = origin
    if (innerEl) {
      innerEl.style.transform = `scale(${zoomFactor()})`
      innerEl.style.transformOrigin = origin
    }
  }

  createEffect(() => {
    // Tracks currentPosition/maskImage/zoomFactor → style updates.
    applyLayerStyles()
  })

  const handleMouseMove = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsHovering(false)
  }

  return (
    <div
      {...rest}
      class={`relative z-20 overflow-hidden rounded-xl ${own.class ?? ''} ${own.className ?? ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={ariaLabel()}
      tabIndex={0}
    >
      <div ref={baseEl} class="contents">
        {own.children}
      </div>
      <Show when={present()}>
        <div ref={layerRef} class="absolute inset-0 z-50 overflow-hidden">
          <div ref={innerEl} class="absolute inset-0" />
        </div>
      </Show>
    </div>
  )
}

export default Lens
