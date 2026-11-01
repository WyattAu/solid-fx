import { createEffect, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'

export type NoiseBlendMode =
  | 'normal'
  | 'overlay'
  | 'soft-light'
  | 'multiply'
  | 'screen'
  | 'difference'

export type NoiseProps = {
  opacity?: number
  size?: number
  fps?: number
  blendMode?: NoiseBlendMode
  contrast?: number
  colored?: boolean
  dust?: number
  scratches?: number
  scanlines?: number
  flicker?: number
  fixed?: boolean
  zIndex?: number
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

const ROOT = 'pointer-events-none absolute inset-0 overflow-hidden'
const FIXED = 'pointer-events-none fixed inset-0 overflow-hidden'
const GRAIN = 'absolute inset-0 bg-repeat [image-rendering:pixelated]'
const DUST = 'absolute inset-0 h-full w-full'
const LINES =
  'absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.55)_0,rgba(0,0,0,0.55)_1px,transparent_1px,transparent_3px)]'

const TILE = 256
const TAU = Math.PI * 2
const BLENDS: NoiseBlendMode[] = [
  'normal',
  'overlay',
  'soft-light',
  'multiply',
  'screen',
  'difference',
]

interface NoiseSettings {
  opacity: number
  size: number
  fps: number
  flicker: number
  dust: number
  scratches: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const generator = (seed: number) => {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= (t + Math.imul(t ^ (t >>> 7), 61 | t))
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const paintTile = (contrast: number, colored: boolean) => {
  const canvas = document.createElement('canvas')
  canvas.width = TILE
  canvas.height = TILE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const image = ctx.createImageData(TILE, TILE)
  const data = image.data
  const random = generator(1013904223)
  const range = 0.5 + contrast * 1.1
  const sample = () => clamp(0.5 + (random() + random() - 1) * range, 0, 1) * 255
  for (let i = 0; i < data.length; i += 4) {
    const value = sample()
    data[i] = value
    data[i + 1] = colored ? sample() : value
    data[i + 2] = colored ? sample() : value
    data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

const drawSpeck = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  tone: string,
  alpha: number,
) => {
  const lobes = 1 + Math.floor(Math.random() * 3)
  for (let k = 0; k < lobes; k++) {
    const ox = x + (Math.random() - 0.5) * radius * 1.4
    const oy = y + (Math.random() - 0.5) * radius * 1.4
    const size = radius * (0.55 + Math.random() * 0.5)
    const fill = ctx.createRadialGradient(ox, oy, 0, ox, oy, size)
    fill.addColorStop(0, `rgba(${tone}, ${alpha})`)
    fill.addColorStop(0.55, `rgba(${tone}, ${alpha * 0.85})`)
    fill.addColorStop(1, `rgba(${tone}, 0)`)
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(ox, oy, size, 0, TAU)
    ctx.fill()
  }
}

const drawHair = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const x = Math.random() * width
  const y = Math.random() * height
  const length = 14 + Math.random() * 46
  const angle = Math.random() * TAU
  const bend = (Math.random() - 0.5) * length * 0.9
  const ex = x + Math.cos(angle) * length
  const ey = y + Math.sin(angle) * length
  const cx = (x + ex) / 2 - Math.sin(angle) * bend
  const cy = (y + ey) / 2 + Math.cos(angle) * bend
  ctx.strokeStyle = `rgba(16, 12, 9, ${0.4 + Math.random() * 0.35})`
  ctx.lineWidth = 0.6 + Math.random() * 0.7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(cx, cy, ex, ey)
  ctx.stroke()
}

const Noise = (props: NoiseProps) => {
  let root!: HTMLDivElement
  let grain!: HTMLDivElement
  let dust!: HTMLCanvasElement
  let lines!: HTMLDivElement | undefined
  let objectUrl = ''
  let wakeRef: (() => void) | null = null

  const opacity = () => clamp(props.opacity ?? 0.2, 0, 1)
  const grainSize = () => Math.max(0.5, props.size ?? 1)
  const fps = () => clamp(props.fps ?? 24, 0, 60)
  const flicker = () => clamp(props.flicker ?? 0, 0, 1)
  const dustAmount = () => clamp(props.dust ?? 0, 0, 1)
  const scratches = () => clamp(props.scratches ?? 0, 0, 1)
  const blend = () =>
    BLENDS.includes(props.blendMode ?? 'overlay') ? (props.blendMode as NoiseBlendMode) : 'normal'

  const settingsRef: { current: NoiseSettings } = {
    current: {
      opacity: opacity(),
      size: grainSize(),
      fps: fps(),
      flicker: flicker(),
      dust: dustAmount(),
      scratches: scratches(),
    },
  }

  // Upstream reassigned settings every render and woke the loop in a trailing
  // effect; both collapse into this tracked effect.
  createEffect(() => {
    settingsRef.current = {
      opacity: opacity(),
      size: grainSize(),
      fps: fps(),
      flicker: flicker(),
      dust: dustAmount(),
      scratches: scratches(),
    }
    wakeRef?.()
  })

  // Upstream deps: [contrast, colored] — repaint the grain tile.
  createEffect(() => {
    const grainEl = grain
    if (!grainEl) return
    const contrastNow = clamp(props.contrast ?? 0.6, 0, 1)
    const coloredNow = props.colored ?? false
    let alive = true
    onCleanup(() => {
      alive = false
    })
    const canvas = paintTile(contrastNow, coloredNow)
    canvas?.toBlob(blob => {
      if (!alive || !blob) return
      const previous = objectUrl
      objectUrl = URL.createObjectURL(blob)
      grainEl.style.backgroundImage = `url("${objectUrl}")`
      if (previous) URL.revokeObjectURL(previous)
    })
  })

  onMount(() => {
    const rootEl = root
    const grainEl = grain
    const canvas = dust
    const ctx = canvas?.getContext('2d')
    if (!rootEl || !grainEl || !canvas || !ctx) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const scratchList: {
      x: number
      age: number
      life: number
      weight: number
      light: boolean
      phase: number
    }[] = []
    let raf = 0
    let last = 0
    let roll = 0
    let visible = true
    let alive = true
    let width = 1
    let height = 1

    const paintDust = (s: NoiseSettings, step: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (s.dust <= 0 && s.scratches <= 0 && scratchList.length === 0) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const area = (width * height) / 400000

      if (s.dust > 0) {
        const specks = Math.round(s.dust * 42 * area * (0.6 + Math.random() * 0.8))
        for (let i = 0; i < specks; i++) {
          const light = Math.random() < 0.3
          drawSpeck(
            ctx,
            Math.random() * width,
            Math.random() * height,
            0.6 + Math.random() ** 2.5 * 3.4,
            light ? '255, 250, 240' : '18, 14, 10',
            0.6 + Math.random() * 0.35,
          )
        }
        const hairs =
          Math.random() < s.dust * 0.7 ? 1 + Math.floor(Math.random() * s.dust * 2.4) : 0
        for (let i = 0; i < hairs; i++) drawHair(ctx, width, height)
      }

      if (step) {
        if (scratchList.length < 3 && Math.random() < s.scratches * 0.06) {
          scratchList.push({
            x: Math.random() * width,
            age: 0,
            life: 0.6 + Math.random() * 2.6,
            weight: 0.6 + Math.random() * 0.8,
            light: Math.random() < 0.7,
            phase: Math.random() * TAU,
          })
        }
        for (let i = scratchList.length - 1; i >= 0; i--) {
          const scratch = scratchList[i]
          scratch.age += step
          scratch.x += (Math.random() - 0.5) * 1.2
          if (scratch.age >= scratch.life) scratchList.splice(i, 1)
        }
      }
      scratchList.forEach(scratch => {
        const fade = Math.min(1, scratch.age / 0.15, (scratch.life - scratch.age) / 0.3)
        const alpha = (0.25 + Math.random() * 0.35) * fade
        ctx.strokeStyle = scratch.light
          ? `rgba(255, 252, 245, ${alpha})`
          : `rgba(14, 11, 8, ${alpha})`
        ctx.lineWidth = scratch.weight
        ctx.beginPath()
        for (let y = 0; y <= height; y += 24) {
          const x = scratch.x + Math.sin(y * 0.012 + scratch.phase) * 1.4
          if (y === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      })
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, rootEl.clientWidth)
      height = Math.max(1, rootEl.clientHeight)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      paintDust(settingsRef.current, 0)
    }

    const tick = (now: number) => {
      raf = 0
      if (!alive) return
      const s = settingsRef.current
      const rate = reduce ? 0 : s.fps
      if (rate > 0 && now - last >= 1000 / rate) {
        const step = last ? Math.min(0.2, (now - last) / 1000) : 1 / rate
        last = now
        const span = TILE * s.size
        grainEl.style.backgroundPosition = `${(Math.random() * span).toFixed(1)}px ${(Math.random() * span).toFixed(1)}px`
        grainEl.style.opacity = String(s.opacity * (1 - s.flicker * Math.random() * 0.7))
        roll = (roll + 1) % 3
        lines?.style.setProperty('background-position', `0 ${roll}px`)
        paintDust(s, step)
      }
      if (visible && rate > 0) raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      paintDust(settingsRef.current, 0)
      if (raf || !alive || !visible) return
      raf = requestAnimationFrame(tick)
    }
    wakeRef = wake

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(rootEl)
    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      if (visible) wake()
    })
    visibility.observe(rootEl)
    resize()
    wake()

    onCleanup(() => {
      alive = false
      cancelAnimationFrame(raf)
      wakeRef = null
      resizeObserver.disconnect()
      visibility.disconnect()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = ''
    })
  })

  return (
    <div
      ref={root}
      class={`${(props.fixed ?? false) ? FIXED : ROOT}${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      style={{ 'z-index': props.zIndex, ...props.style }}
      aria-hidden="true"
    >
      <div
        ref={grain}
        class={GRAIN}
        style={{
          opacity: opacity(),
          'mix-blend-mode': blend(),
          'background-size': `${TILE * grainSize()}px ${TILE * grainSize()}px`,
        }}
      />
      <canvas ref={dust} class={DUST} />
      {(props.scanlines ?? 0) > 0 && (
        <div
          ref={lines}
          class={LINES}
          style={{ opacity: clamp(props.scanlines ?? 0, 0, 1), 'mix-blend-mode': blend() }}
        />
      )}
    </div>
  )
}

export default Noise
