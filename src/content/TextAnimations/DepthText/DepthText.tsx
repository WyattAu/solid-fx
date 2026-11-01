import { createEffect, createMemo, createSignal, For, onCleanup } from 'solid-js'
import type { JSX } from 'solid-js'

export interface DepthTextProps {
  text?: string
  layers?: number
  depth?: number
  faceColor?: string
  depthColor?: string
  gradientDepth?: boolean
  tilt?: number
  pointerTracking?: boolean
  smoothing?: number
  perspective?: number
  autoOrbit?: boolean
  orbitSpeed?: number
  hoverPush?: number
  float?: boolean
  fontSize?: string
  fontWeight?: number | string
  shadow?: boolean
  outline?: boolean
  intro?: boolean
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

interface DepthLayer {
  index: number
  color: string
  transform: string
}

interface Rotation {
  x: number
  y: number
}

interface MotionState {
  push: number
  velocity: number
  float: number
}

const MAX_LAYERS = 64
const INTRO_MS = 1200
const PUSH_STIFFNESS = 260
const PUSH_DAMPING = 17
const PRESS_EXTRA = 0.25
const FLOAT_EASE = 0.7

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const getLayerColor = (
  faceColor: string,
  depthColor: string,
  index: number,
  total: number,
): string => {
  const progress = total <= 1 ? 1 : index / total
  const eased = progress * progress
  const faceMix = Math.round((1 - eased) * 72 + 4)
  return `color-mix(in srgb, color-mix(in srgb, ${faceColor} ${faceMix}%, ${depthColor}) 92%, black)`
}

const getFadeColor = (
  depthColor: string,
  index: number,
  total: number,
  outline: boolean,
): string => {
  const reach = (layer: number) => clamp(1 - (layer - 0.5) / total, 0, 1) ** 1.6
  const here = reach(index)
  const behind = index >= total ? 0 : reach(index + 1)
  const alpha = outline ? here : behind >= 1 ? 1 : 1 - (1 - here) / (1 - behind)
  return `color-mix(in srgb, ${depthColor} ${(clamp(alpha, 0, 1) * 100).toFixed(2)}%, transparent)`
}

const getTransform = (rotateX: number, rotateY: number, lift = 0, roll = 0, sink = 0): string =>
  [
    lift ? `translateY(${lift.toFixed(2)}px)` : '',
    roll ? `rotateZ(${roll.toFixed(3)}deg)` : '',
    `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`,
    sink ? `translateZ(${(-sink).toFixed(2)}px)` : '',
  ]
    .filter(Boolean)
    .join(' ')

const DepthText = (props: DepthTextProps) => {
  let rootEl!: HTMLSpanElement
  let stageEl!: HTMLSpanElement
  let rotation: Rotation | null = null
  const motionState: MotionState = { push: 0, velocity: 0, float: 0 }
  let introProgress = (props.intro ?? true) ? 0 : 1
  const [introDone, setIntroDone] = createSignal(!(props.intro ?? true))

  const safeLayers = () => clamp(Math.round(Number(props.layers ?? 34)) || 1, 2, MAX_LAYERS)
  const safeDepth = () => clamp(Number(props.depth ?? 2.4) || 0, 0, 12)
  const safeTilt = () => clamp(Number(props.tilt ?? 7.5) || 0, 0, 12)
  const safeSmoothing = () => clamp(Number(props.smoothing ?? 0.14) || 0.14, 0.02, 0.35)
  const safePerspective = () => clamp(Number(props.perspective ?? 900) || 900, 300, 2000)
  const safeOrbitSpeed = () => clamp(Number(props.orbitSpeed ?? 0.35) || 0, 0, 2)
  const safePush = () => clamp(Number(props.hoverPush ?? 0) || 0, 0, 1)
  const extent = () => safeLayers() * safeDepth()

  const baseRotation = createMemo(() => ({ x: -safeTilt() * 0.32, y: safeTilt() * 0.42 }))
  // One-shot: upstream froze this via a state initializer on first render.
  const initialTransform = getTransform(baseRotation().x, baseRotation().y)

  const depthLayers = createMemo<DepthLayer[]>(() =>
    Array.from({ length: safeLayers() }, (_, layerIndex) => {
      const index = safeLayers() - layerIndex
      return {
        index,
        color:
          (props.gradientDepth ?? false)
            ? getFadeColor(
                props.depthColor ?? '#7c3aed',
                index,
                safeLayers(),
                props.outline ?? false,
              )
            : getLayerColor(
                props.faceColor ?? 'currentColor',
                props.depthColor ?? '#7c3aed',
                index,
                safeLayers(),
              ),
        transform: `translateZ(calc(var(--depth-text-grow, 1) * ${(-index * safeDepth()).toFixed(2)}px))`,
      }
    }),
  )

  createEffect(() => {
    // Upstream deps: [autoOrbit, baseRotation, pointerTracking, safeOrbitSpeed,
    // safeSmoothing, safeTilt, safePush, float, extent] — all read up front.
    const autoOrbit = props.autoOrbit ?? true
    const base = baseRotation()
    const pointerTracking = props.pointerTracking ?? true
    const orbitSpeed = safeOrbitSpeed()
    const smoothing = safeSmoothing()
    const tilt = safeTilt()
    const push = safePush()
    const float = props.float ?? false
    const extentNow = extent()

    const root = rootEl
    const stage = stageEl
    if (!root || !stage) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const canTrackPointer = pointerTracking && finePointer && !reducedMotion
    const listensToHover = (push > 0 || float) && !reducedMotion

    let frameId = 0
    let visible = true
    let activePointer = false
    let hovered = false
    let pressed = false
    let lastTime = 0
    let size = root.offsetHeight
    const startTime = performance.now()
    const motion = motionState
    const current = rotation || { ...base }
    const target = { ...base }
    rotation = current

    const sinkAmount = () => clamp(motion.push, -0.25, 1)

    const applyTransform = (now = performance.now()) => {
      const time = (now - startTime) / 1000
      const drift = motion.float
      stage.style.transform = getTransform(
        current.x + (drift ? Math.cos(time * 1.19) * 2 * drift : 0),
        current.y + (drift ? Math.sin(time * 0.86 + 2.1) * 4 * drift : 0),
        drift ? Math.sin(time * 1.43) * size * 0.045 * drift : 0,
        drift ? Math.sin(time * 1.03 + 0.8) * 1.6 * drift : 0,
        sinkAmount() * extentNow,
      )
    }

    const applyGrow = () => {
      const progress = introProgress
      const grow = progress >= 1 ? 1 : 1 - (1 - progress) ** 3
      const value = grow * (1 - sinkAmount())
      stage.style.setProperty('--depth-text-grow', value === 1 ? '1' : value.toFixed(4))
    }

    if (reducedMotion) {
      introProgress = 1
      motion.push = 0
      motion.velocity = 0
      motion.float = 0
      applyGrow()
      setIntroDone(true)
      current.x = base.x
      current.y = base.y
      applyTransform()
      return
    }

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = 0
    }

    const tick = (now: number) => {
      const delta = lastTime ? Math.min(now - lastTime, 50) : 16
      lastTime = now

      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + delta / INTRO_MS)
        if (introProgress >= 1) setIntroDone(true)
      }

      if ((!canTrackPointer || !activePointer) && autoOrbit) {
        const elapsed = (now - startTime) / 1000
        const orbit = elapsed * orbitSpeed * Math.PI * 2
        const fallbackAmount = canTrackPointer ? 0.18 : 0.55
        target.x = base.x + Math.sin(orbit) * tilt * fallbackAmount
        target.y = base.y + Math.cos(orbit * 0.85) * tilt * fallbackAmount
      }

      current.x += (target.x - current.x) * smoothing
      current.y += (target.y - current.y) * smoothing

      const pushGoal =
        push > 0 && (hovered || pressed) ? Math.min(1, push + (pressed ? PRESS_EXTRA : 0)) : 0
      let remaining = delta / 1000
      while (remaining > 0) {
        const step = Math.min(remaining, 1 / 120)
        motion.velocity +=
          (PUSH_STIFFNESS * (pushGoal - motion.push) - PUSH_DAMPING * motion.velocity) * step
        motion.push += motion.velocity * step
        remaining -= step
      }
      const springIdle =
        Math.abs(pushGoal - motion.push) < 0.0005 && Math.abs(motion.velocity) < 0.002
      if (springIdle) {
        motion.push = pushGoal
        motion.velocity = 0
      }

      const floatGoal = float && !hovered && !pressed ? 1 : 0
      motion.float += (floatGoal - motion.float) * (1 - Math.exp(-delta / 1000 / FLOAT_EASE))
      if (Math.abs(floatGoal - motion.float) < 0.001) motion.float = floatGoal

      applyGrow()
      applyTransform(now)

      const settled =
        Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001
      if (!autoOrbit && !motion.float && settled && springIdle && introProgress >= 1) {
        frameId = 0
        return
      }

      frameId = requestAnimationFrame(tick)
    }

    const start = () => {
      if (frameId || !visible) return
      lastTime = 0
      frameId = requestAnimationFrame(tick)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      activePointer = true
      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8), -1, 1)
      const y = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8), -1, 1)

      target.x = base.x - y * tilt
      target.y = base.y + x * tilt
      start()
    }

    const handlePointerLeave = () => {
      activePointer = false
      target.x = base.x
      target.y = base.y
      start()
    }

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) handlePointerLeave()
    }

    const isHoverPointer = (event: PointerEvent) =>
      event.pointerType === 'mouse' || event.pointerType === 'pen'

    const handleEnter = (event: PointerEvent) => {
      if (!isHoverPointer(event)) return
      hovered = true
      start()
    }

    const handleLeave = () => {
      hovered = false
      pressed = false
      start()
    }

    const handleDown = () => {
      pressed = true
      start()
    }

    const handleUp = (event: PointerEvent) => {
      pressed = false
      if (!isHoverPointer(event)) hovered = false
      start()
    }

    if (canTrackPointer) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerout', handlePointerOut)
      window.addEventListener('blur', handlePointerLeave)
    }

    if (listensToHover) {
      root.addEventListener('pointerenter', handleEnter)
      root.addEventListener('pointerleave', handleLeave)
      root.addEventListener('pointerdown', handleDown)
      root.addEventListener('pointerup', handleUp)
      root.addEventListener('pointercancel', handleLeave)
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
            if (visible) start()
            else stop()
          })
    observer?.observe(root)

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            size = root.offsetHeight
          })
    resizeObserver?.observe(root)

    applyGrow()
    applyTransform()
    start()

    onCleanup(() => {
      if (canTrackPointer) {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerout', handlePointerOut)
        window.removeEventListener('blur', handlePointerLeave)
      }
      if (listensToHover) {
        root.removeEventListener('pointerenter', handleEnter)
        root.removeEventListener('pointerleave', handleLeave)
        root.removeEventListener('pointerdown', handleDown)
        root.removeEventListener('pointerup', handleUp)
        root.removeEventListener('pointercancel', handleLeave)
      }
      observer?.disconnect()
      resizeObserver?.disconnect()
      stop()
    })
  })

  const text = () => props.text ?? 'Elevate'
  const fontWeight = () => props.fontWeight ?? 900

  const rootStyle = (): JSX.CSSProperties => ({
    ...props.style,
    perspective: `${safePerspective()}px`,
    'perspective-origin': '50% 48%',
    isolation: 'isolate',
  })

  const stageStyle = (): JSX.CSSProperties => ({
    'transform-style': 'preserve-3d',
    transform: initialTransform,
    'transform-origin': '50% 50%',
    'will-change': 'transform',
    '--depth-text-grow': introDone() ? 1 : 0,
  })

  const textStyle = (): JSX.CSSProperties => ({
    'font-size': props.fontSize ?? 'clamp(3rem, 12vw, 7rem)',
    'font-weight': fontWeight(),
    'line-height': 0.86,
    'letter-spacing': '-0.065em',
    'white-space': 'nowrap',
    'user-select': 'none',
    'transform-style': 'preserve-3d',
    'backface-visibility': 'hidden',
    'font-kerning': 'normal',
    'text-rendering': 'geometricPrecision',
  })

  const outlineStyle: JSX.CSSProperties | null =
    (props.outline ?? false)
      ? {
          '-webkit-text-fill-color': 'transparent',
          '-webkit-text-stroke': 'max(1px, 0.012em) currentColor',
        }
      : null

  return (
    <span
      ref={rootEl}
      class={`inline-block ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={rootStyle()}
    >
      <span ref={stageEl} class="relative inline-grid place-items-center" style={stageStyle()}>
        <For each={depthLayers()}>
          {layer => (
            <span
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 z-0 inline-block"
              style={{
                ...textStyle(),
                ...(outlineStyle ?? {}),
                color: layer.color,
                transform: layer.transform,
                'text-shadow':
                  (props.shadow ?? true) &&
                  !(props.gradientDepth ?? false) &&
                  layer.index === safeLayers()
                    ? `0 0.18em 0.32em color-mix(in srgb, ${props.depthColor ?? '#7c3aed'} 24%, rgba(0, 0, 0, 0.42))`
                    : undefined,
              }}
            >
              {text()}
            </span>
          )}
        </For>
        <span
          class="relative z-10 inline-block"
          style={{
            ...textStyle(),
            color: props.faceColor ?? 'currentColor',
            'text-shadow': (props.shadow ?? true) ? '0 0.035em 0.07em rgba(0, 0, 0, 0.28)' : 'none',
            transform: 'translateZ(0.6px)',
          }}
        >
          {text()}
        </span>
      </span>
    </span>
  )
}

export default DepthText
