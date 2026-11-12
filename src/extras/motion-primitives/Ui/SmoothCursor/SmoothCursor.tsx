// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/smooth-cursor.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
// Backfill: ibelick/motion-primitives @120f64f6 ships no smooth-cursor.tsx
// (verified against the components tree; this batch needed 4 more components).
// PORT-NOTE: upstream useSpring(mv) is ported to vanilla motionValues re-anchored
// by animate() spring calls on every pointermove (PORTING.md §5, Cursor
// precedent). motion's left/top/translateX/translateY/rotate/scale composition
// maps to one style update applied on spring change (translate order preserved).

import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControlsWithThen } from 'motion'
import { createEffect, createSignal, onCleanup, onMount, Show, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface SmoothCursorProps {
  /** Custom cursor node rendered at the pointer position. */
  cursor?: JSX.Element
  springConfig?: {
    damping: number
    stiffness: number
    mass: number
    restDelta: number
  }
}

const DESKTOP_POINTER_QUERY = '(any-hover: hover) and (any-pointer: fine)'

function isTrackablePointer(pointerType: string) {
  return pointerType !== 'touch'
}

const DefaultCursorSVG = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={50}
      height={54}
      viewBox="0 0 50 54"
      fill="none"
      style={{ transform: 'scale(0.5)' }}
    >
      <g filter="url(#smooth-cursor-drop-shadow)">
        <path
          d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
          fill="black"
        />
        <path
          d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
          stroke="white"
          stroke-width="2.25825"
        />
      </g>
      <defs>
        <filter
          id="smooth-cursor-drop-shadow"
          x="0.602397"
          y="0.952444"
          width="49.0584"
          height="52.428"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2.25825" />
          <feGaussianBlur stdDeviation="2.25825" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_91_7928" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_91_7928"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  )
}

export function SmoothCursor(props: SmoothCursorProps) {
  const [own, rest] = splitProps(props, ['cursor', 'springConfig'])

  const springConfig = () =>
    own.springConfig ?? { damping: 45, stiffness: 400, mass: 1, restDelta: 0.001 }
  // Upstream default param: cursor = <DefaultCursorSVG />.
  const cursor = () => own.cursor ?? defaultCursor
  const defaultCursor = <DefaultCursorSVG />

  // useRef mutable values → plain closure variables.
  let lastMousePos = { x: 0, y: 0 }
  let velocity = { x: 0, y: 0 }
  let lastUpdateTime = Date.now()
  let previousAngle = 0
  let accumulatedRotation = 0

  const [isEnabled, setIsEnabled] = createSignal(false)
  const [isVisible, setIsVisible] = createSignal(false)

  // Upstream useSpring(0) / useSpring(1) targets, re-anchored per change.
  const cursorX = motionValue(0)
  const cursorY = motionValue(0)
  const rotation = motionValue(0)
  const scale = motionValue(1)

  let rootEl: HTMLDivElement | undefined
  let xControls: AnimationPlaybackControlsWithThen | undefined
  let yControls: AnimationPlaybackControlsWithThen | undefined
  let rControls: AnimationPlaybackControlsWithThen | undefined
  let sControls: AnimationPlaybackControlsWithThen | undefined
  let oControls: AnimationPlaybackControlsWithThen | undefined
  let offs: Array<() => void> = []

  const apply = () => {
    if (!rootEl) return
    rootEl.style.left = `${cursorX.get()}px`
    rootEl.style.top = `${cursorY.get()}px`
    rootEl.style.transform = `translate(-50%, -50%) rotate(${rotation.get()}deg) scale(${scale.get()})`
  }

  onMount(() => {
    // Media-query gate: only track on desktop-class pointers.
    const mediaQuery = window.matchMedia(DESKTOP_POINTER_QUERY)
    const updateEnabled = () => {
      setIsEnabled(mediaQuery.matches)
      if (!mediaQuery.matches) setIsVisible(false)
    }
    updateEnabled()
    mediaQuery.addEventListener('change', updateEnabled)

    offs = [
      cursorX.on('change', apply),
      cursorY.on('change', apply),
      rotation.on('change', apply),
      scale.on('change', apply),
    ]

    onCleanup(() => {
      mediaQuery.removeEventListener('change', updateEnabled)
      offs.forEach(off => off())
      xControls?.stop()
      yControls?.stop()
      rControls?.stop()
      sControls?.stop()
      oControls?.stop()
    })
  })

  // Upstream useEffect([…, isEnabled]): pointer tracking + velocity math.
  createEffect(() => {
    if (!isEnabled()) return

    let timeout: ReturnType<typeof setTimeout> | null = null

    const updateVelocity = (currentPos: { x: number; y: number }) => {
      const currentTime = Date.now()
      const deltaTime = currentTime - lastUpdateTime

      if (deltaTime > 0) {
        velocity = {
          x: (currentPos.x - lastMousePos.x) / deltaTime,
          y: (currentPos.y - lastMousePos.y) / deltaTime,
        }
      }

      lastUpdateTime = currentTime
      lastMousePos = currentPos
    }

    const smoothPointerMove = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) return

      setIsVisible(true)

      const currentPos = { x: e.clientX, y: e.clientY }
      updateVelocity(currentPos)

      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)

      xControls?.stop()
      xControls = animate(cursorX, currentPos.x, springConfig())
      yControls?.stop()
      yControls = animate(cursorY, currentPos.y, springConfig())

      if (speed > 0.1) {
        const currentAngle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI) + 90

        let angleDiff = currentAngle - previousAngle
        if (angleDiff > 180) angleDiff -= 360
        if (angleDiff < -180) angleDiff += 360
        accumulatedRotation += angleDiff
        rControls?.stop()
        rControls = animate(
          rotation,
          accumulatedRotation,
          // Upstream: springConfig with damping 60, stiffness 300.
          { ...springConfig(), damping: 60, stiffness: 300 },
        )
        previousAngle = currentAngle

        sControls?.stop()
        sControls = animate(
          scale,
          0.95,
          // Upstream: springConfig with stiffness 500, damping 35.
          { ...springConfig(), stiffness: 500, damping: 35 },
        )

        if (timeout !== null) clearTimeout(timeout)
        timeout = setTimeout(() => {
          sControls?.stop()
          sControls = animate(scale, 1, { ...springConfig(), stiffness: 500, damping: 35 })
        }, 150)
      }
    }

    let rafId = 0
    const throttledPointerMove = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) return
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        smoothPointerMove(e)
        rafId = 0
      })
    }

    document.body.style.cursor = 'none'
    window.addEventListener('pointermove', throttledPointerMove, {
      passive: true,
    })

    onCleanup(() => {
      window.removeEventListener('pointermove', throttledPointerMove)
      document.body.style.cursor = 'auto'
      if (rafId) cancelAnimationFrame(rafId)
      if (timeout !== null) clearTimeout(timeout)
    })
  })

  // Upstream animate={{ opacity: isVisible ? 1 : 0 }} transition 0.15s.
  createEffect(() => {
    const visible = isVisible()
    if (!rootEl) return
    oControls?.stop()
    oControls = animate(rootEl, { opacity: visible ? 1 : 0 }, { duration: 0.15 })
  })

  return (
    <Show when={isEnabled()}>
      <div
        {...rest}
        ref={rootEl}
        style={{
          position: 'fixed',
          'z-index': 100,
          'pointer-events': 'none',
          'will-change': 'transform',
          opacity: 0,
        }}
      >
        {cursor()}
      </div>
    </Show>
  )
}

export default SmoothCursor
