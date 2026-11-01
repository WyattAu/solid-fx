import { createEffect, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

type Variant = 'linear' | 'flow' | 'conic'

export interface GradientTextProps {
  children?: JSX.Element
  colors?: string[]
  animationSpeed?: number
  variant?: Variant
  angle?: number
  direction?: 'horizontal' | 'vertical' | 'diagonal'
  scale?: number
  yoyo?: boolean
  glow?: number
  showBorder?: boolean
  borderWidth?: number
  pauseOnHover?: boolean
  followPointer?: boolean
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

interface Settings {
  colors: string[]
  speed: number
  variant: Variant
  angle: number
  scale: number
  yoyo: boolean
  pauseOnHover: boolean
  followPointer: boolean
}

const VARIANTS: Variant[] = ['linear', 'flow', 'conic']
const ANGLES: Record<string, number> = { horizontal: 90, vertical: 180, diagonal: 135 }
const TAU = Math.PI * 2

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const GradientText = (props: GradientTextProps) => {
  let root!: HTMLSpanElement

  const palette = () => {
    const colors = props.colors ?? ['#5227FF', '#FF9FFC', '#B497CF']
    return colors.length > 1 ? colors : [colors[0] ?? '#ffffff', colors[0] ?? '#ffffff']
  }
  const loop = () => [...palette(), palette()[0]]

  // Upstream rebuilt `settingsRef.current` on every render; this effect keeps
  // the plain object in sync with the same reactive inputs.
  let settings: Settings = {
    colors: palette(),
    speed: Math.max(0.2, props.animationSpeed ?? 8),
    variant: VARIANTS.includes((props.variant ?? 'linear') as Variant)
      ? (props.variant as Variant)
      : 'linear',
    angle: props.direction ? (ANGLES[props.direction] ?? props.angle ?? 90) : (props.angle ?? 90),
    scale: clamp(props.scale ?? 3, 1, 6),
    yoyo: props.yoyo ?? true,
    pauseOnHover: props.pauseOnHover ?? false,
    followPointer: props.followPointer ?? false,
  }
  createEffect(() => {
    settings = {
      colors: palette(),
      speed: Math.max(0.2, props.animationSpeed ?? 8),
      variant: VARIANTS.includes((props.variant ?? 'linear') as Variant)
        ? (props.variant as Variant)
        : 'linear',
      angle: props.direction ? (ANGLES[props.direction] ?? props.angle ?? 90) : (props.angle ?? 90),
      scale: clamp(props.scale ?? 3, 1, 6),
      yoyo: props.yoyo ?? true,
      pauseOnHover: props.pauseOnHover ?? false,
      followPointer: props.followPointer ?? false,
    }
    wakeRef.current?.()
  })

  const state = {
    time: 0,
    inside: false,
    visible: true,
    x: 0.5,
    y: 0.5,
    px: 0.5,
    py: 0.5,
    vx: 0,
    vy: 0,
    pull: 0,
  }
  let raf = 0
  let last = 0
  let alive = true
  const wakeRef: { current: (() => void) | null } = { current: null }

  const paint = () => {
    const s = settings
    const list = s.colors
    const cycle = state.time / s.speed
    let image
    if (s.variant === 'flow') {
      const blobs = list.map((color, i) => {
        const spin = cycle * TAU
        const rate = 0.55 + ((i * 0.618) % 1) * 0.5
        let x = 50 + 44 * Math.sin(spin * rate + i * 2.1)
        let y = 50 + 40 * Math.sin(spin * (rate * 0.83 + 0.21) + i * 1.3)
        if (i === 0) {
          x += (state.px * 100 - x) * state.pull
          y += (state.py * 100 - y) * state.pull
        }
        return `radial-gradient(ellipse ${(22 + 12 * s.scale).toFixed(1)}% ${(60 + 30 * s.scale).toFixed(1)}% at ${x.toFixed(2)}% ${y.toFixed(2)}%, ${color} 0%, transparent 100%)`
      })
      image = `${blobs.join(', ')}, linear-gradient(${s.angle}deg, ${list.join(', ')})`
    } else if (s.variant === 'conic') {
      const sway = s.yoyo ? Math.sin(cycle * Math.PI) * 50 : cycle * 360
      const cx = 50 + (state.px * 100 - 50) * state.pull
      const cy = 260 + (state.py * 100 - 260) * state.pull
      image = `repeating-conic-gradient(from ${(sway - 30).toFixed(2)}deg at ${cx.toFixed(2)}% ${cy.toFixed(2)}%, ${[...list, list[0]].map((color, i) => `${color} ${((i / list.length) * 60 * (3 / s.scale)).toFixed(2)}deg`).join(', ')})`
    } else {
      const stopLoop = [...list, list[0]]
      const period = 100 * s.scale
      let offset
      if (s.yoyo) {
        const swing = cycle % 2
        const t = swing < 1 ? swing : 2 - swing
        offset = (0.5 - Math.cos(Math.PI * t) / 2) * (period - 100)
      } else {
        offset = (cycle % 1) * period
      }
      offset += (state.px - 0.5) * period * 0.5 * state.pull
      const stops = stopLoop.map(
        (color, i) => `${color} ${((i / (stopLoop.length - 1)) * period - offset).toFixed(2)}%`,
      )
      image = `repeating-linear-gradient(${s.angle}deg, ${stops.join(', ')})`
    }
    root.style.setProperty('--gt-gradient', image)
  }

  const tick = (now: number) => {
    raf = 0
    if (!alive) return
    const s = settings
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
    last = now
    const paused = reduce || (s.pauseOnHover && state.inside)
    if (!paused) state.time += dt
    const target = s.followPointer && state.inside ? 1 : 0
    state.pull += (target - state.pull) * (1 - Math.exp(-dt * 6))
    const stiffness = 160
    state.vx += ((state.x - state.px) * stiffness - state.vx * 2 * Math.sqrt(stiffness)) * dt
    state.vy += ((state.y - state.py) * stiffness - state.vy * 2 * Math.sqrt(stiffness)) * dt
    state.px += state.vx * dt
    state.py += state.vy * dt
    paint()
    const settling =
      Math.abs(state.pull - target) > 0.001 || Math.abs(state.vx) + Math.abs(state.vy) > 0.001
    if (!state.visible || (paused && !settling)) return
    raf = requestAnimationFrame(tick)
  }

  const wake = () => {
    if (raf || !alive) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }
  wakeRef.current = () => {
    paint()
    wake()
  }

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  onMount(() => {
    const locate = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      state.x = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      state.y = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    }
    const onEnter = (event: PointerEvent) => {
      locate(event)
      if (!state.inside) {
        state.px = state.x
        state.py = state.y
      }
      state.inside = true
      wake()
    }
    const onMove = (event: PointerEvent) => {
      locate(event)
      wake()
    }
    const onLeave = () => {
      state.inside = false
      wake()
    }

    const observer = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting)
      if (state.visible) wake()
    })
    observer.observe(root)
    root.addEventListener('pointerenter', onEnter)
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
    paint()
    wake()

    onCleanup(() => {
      alive = false
      cancelAnimationFrame(raf)
      observer.disconnect()
      root.removeEventListener('pointerenter', onEnter)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      wakeRef.current = null
    })
  })

  return (
    <span
      ref={root}
      class={`relative inline-flex items-center justify-center max-w-full isolate ${props.showBorder ? 'px-[0.75em] py-[0.35em] rounded-full before:content-[] before:absolute before:inset-0 before:p-[var(--gt-border)] before:rounded-[inherit] before:[background-image:var(--gt-gradient)] before:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[-webkit-mask-composite:xor] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] before:pointer-events-none' : ''}${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      style={{
        '--gt-gradient': `linear-gradient(${props.direction ? (ANGLES[props.direction] ?? props.angle ?? 90) : (props.angle ?? 90)}deg, ${loop().join(', ')})`,
        '--gt-border': `${props.borderWidth ?? 1.5}px`,
        '--gt-glow': clamp(props.glow ?? 0, 0, 1),
        ...props.style,
      }}
    >
      <span class="relative inline-block">
        <span class="inline-block [background-image:var(--gt-gradient)] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
          {props.children}
        </span>
        <Show when={(props.glow ?? 0) > 0}>
          <span
            class="absolute inset-0 -z-10 [background-image:var(--gt-gradient)] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [filter:blur(0.3em)_saturate(1.4)] opacity-[var(--gt-glow)] pointer-events-none select-none"
            aria-hidden="true"
          >
            {props.children}
          </span>
        </Show>
      </span>
    </span>
  )
}

export default GradientText
