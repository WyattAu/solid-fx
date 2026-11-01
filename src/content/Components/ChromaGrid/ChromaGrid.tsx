import { createEffect, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'
import { For } from 'solid-js'

export interface ChromaItem {
  image: string
  title?: string
  subtitle?: string
  accent?: string
  url?: string
  alt?: string
  borderColor?: string
}

export interface ChromaGridProps {
  items?: ChromaItem[]
  columns?: number
  minCardWidth?: number
  gap?: number
  radius?: number
  softness?: number
  damping?: number
  fadeOut?: number
  grayscale?: number
  dim?: number
  glow?: number
  borderGlow?: number
  reveal?: 'spotlight' | 'card'
  aspectRatio?: string
  cardRadius?: number
  showInfo?: boolean
  frame?: boolean
  theme?: 'dark' | 'light'
  className?: string
  class?: string
}

const THEMES: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--chroma-frame': 'rgba(38, 35, 46, 0.66)',
    '--chroma-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--chroma-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--chroma-frame-shadow':
      '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--chroma-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--chroma-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--chroma-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--chroma-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--chroma-media-edge': 'rgba(255, 255, 255, 0.06)',
    '--chroma-well': 'rgba(255, 255, 255, 0.08)',
    '--chroma-ink': '#f4f4f5',
    '--chroma-muted': 'rgba(244, 244, 245, 0.55)',
    '--chroma-hover': 'brightness(1.12)',
    '--chroma-press': 'brightness(0.85)',
  },
  light: {
    '--chroma-frame': 'rgba(240, 240, 243, 0.8)',
    '--chroma-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--chroma-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--chroma-frame-shadow':
      '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--chroma-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--chroma-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--chroma-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--chroma-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--chroma-media-edge': 'rgba(24, 24, 27, 0.06)',
    '--chroma-well': 'rgba(24, 24, 27, 0.05)',
    '--chroma-ink': '#27272a',
    '--chroma-muted': 'rgba(39, 39, 42, 0.55)',
    '--chroma-hover': 'brightness(0.97)',
    '--chroma-press': 'brightness(0.92)',
  },
}

const DEFAULT_ITEMS: ChromaItem[] = [
  {
    image:
      'https://images.unsplash.com/photo-1514519334989-3d5c8b1a9f91?w=800&q=80&auto=format&fit=crop',
    title: 'Golden Hour',
    subtitle: 'Sky study',
    accent: '#ff8a4c',
  },
  {
    image:
      'https://images.unsplash.com/photo-1520930528075-4ea5ead759f5?w=800&q=80&auto=format&fit=crop',
    title: 'Steel Arches',
    subtitle: 'Sculpture',
    accent: '#ff5a36',
  },
  {
    image:
      'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=800&q=80&auto=format&fit=crop',
    title: 'Black Beach',
    subtitle: 'Landscape',
    accent: '#a98bff',
  },
  {
    image:
      'https://images.unsplash.com/photo-1524400968894-6e997a66e03f?w=800&q=80&auto=format&fit=crop',
    title: 'Cloud Front',
    subtitle: 'Weather',
    accent: '#ffb27a',
  },
  {
    image:
      'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=800&q=80&auto=format&fit=crop',
    title: 'Pink Drift',
    subtitle: 'Sky study',
    accent: '#ff7eb6',
  },
  {
    image:
      'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=800&q=80&auto=format&fit=crop',
    title: 'Cumulus',
    subtitle: 'Weather',
    accent: '#7cc4ff',
  },
]

const SPOT_MASK =
  'radial-gradient(circle var(--chroma-r) at calc(var(--chroma-x, -9999px) - var(--chroma-ox, 0px)) calc(var(--chroma-y, -9999px) - var(--chroma-oy, 0px)), var(--chroma-stops))'
const GRID_COLUMNS =
  'repeat(auto-fill, minmax(min(100%, max(var(--chroma-min), calc((100% - (var(--chroma-cols) - 1) * var(--chroma-gap)) / var(--chroma-cols)))), 1fr))'
const WASH = 'radial-gradient(130% 70% at 50% 100%, var(--chroma-accent), transparent 72%)'
const TILE_RIM =
  'inset 0 0 0 1px var(--chroma-tile-edge), inset 0 1px 0 var(--chroma-tile-highlight)'
const GLOW_RIM = 'inset 0 0 0 1px var(--chroma-accent), inset 0 0 16px -8px var(--chroma-accent)'
const FRAME_RIM =
  'inset 0 0 0 1px var(--chroma-frame-edge), inset 0 1px 0 var(--chroma-frame-highlight)'
const IMAGE_CLASS =
  'absolute inset-0 block h-full w-full select-none object-cover [-webkit-user-drag:none]'
const CARD_CLASS =
  'group relative box-border flex min-w-0 flex-col gap-[10px] overflow-hidden p-2 no-underline [isolation:isolate] transition-[filter] duration-[250ms] ease-[ease] hover:[filter:var(--chroma-hover)]'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const falloffStops = (softness: number) => {
  const core = clamp(1 - softness, 0, 0.95)
  const stops = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const u = clamp((t - core) / Math.max(0.0001, 1 - core), 0, 1)
    const alpha = 1 - u * u * u * (u * (u * 6 - 15) + 10)
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(t * 100).toFixed(1)}%`)
  }
  return stops.join(', ')
}

export const ChromaGrid = (props: ChromaGridProps) => {
  let root!: HTMLDivElement
  const data = () => (props.items?.length ? props.items : DEFAULT_ITEMS)
  const spotlight = () => props.reveal !== 'card'

  onMount(() => {
    const el = root
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const state = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, primed: false }
    let raf = 0
    let last = 0

    const place = () => {
      const box = el.getBoundingClientRect()
      el.querySelectorAll<HTMLElement>('[data-chroma-area]').forEach(node => {
        const rect = node.getBoundingClientRect()
        node.style.setProperty('--chroma-ox', `${rect.left - box.left}px`)
        node.style.setProperty('--chroma-oy', `${rect.top - box.top}px`)
      })
    }

    const frame = (now: number) => {
      raf = 0
      const damping = props.damping ?? 0.45
      const fadeOut = props.fadeOut ?? 0.6
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const follow = reduce ? 1 : 1 - Math.exp(-dt / Math.max(0.01, damping * 0.32))
      state.x += (state.tx - state.x) * follow
      state.y += (state.ty - state.y) * follow
      const span = state.target > state.power ? 0.1 : Math.max(0.02, fadeOut * 0.35)
      state.power += (state.target - state.power) * (reduce ? 1 : 1 - Math.exp(-dt / span))
      el.style.setProperty('--chroma-x', `${state.x.toFixed(2)}px`)
      el.style.setProperty('--chroma-y', `${state.y.toFixed(2)}px`)
      el.style.setProperty('--chroma-power', state.power.toFixed(4))
      const settled =
        Math.abs(state.tx - state.x) < 0.1 &&
        Math.abs(state.ty - state.y) < 0.1 &&
        Math.abs(state.target - state.power) < 0.002
      if (settled) {
        state.power = state.target
        el.style.setProperty('--chroma-power', state.power.toFixed(4))
        last = 0
      } else {
        raf = requestAnimationFrame(frame)
      }
    }

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const onMove = (event: PointerEvent) => {
      if (props.reveal === 'card') return
      const box = el.getBoundingClientRect()
      state.tx = event.clientX - box.left
      state.ty = event.clientY - box.top
      if (!state.primed || state.power < 0.02) {
        state.x = state.tx
        state.y = state.ty
        state.primed = true
      }
      state.target = 1
      wake()
    }

    const onLeave = () => {
      state.target = 0
      wake()
    }

    const resizeObserver = new ResizeObserver(place)
    resizeObserver.observe(el)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onMove)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('pointercancel', onLeave)
    place()

    onCleanup(() => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('pointercancel', onLeave)
    })
  })

  // Upstream re-ran placeRef on every render (useLayoutEffect without deps);
  // re-measure when the rendered data changes.
  createEffect(() => {
    data()
    const cols = Math.max(1, Math.round(props.columns ?? 3))
    void cols
    queueMicrotask(() => {
      const el = root
      if (!el) return
      const box = el.getBoundingClientRect()
      el.querySelectorAll<HTMLElement>('[data-chroma-area]').forEach(node => {
        const rect = node.getBoundingClientRect()
        node.style.setProperty('--chroma-ox', `${rect.left - box.left}px`)
        node.style.setProperty('--chroma-oy', `${rect.top - box.top}px`)
      })
    })
  })

  const rootStyle = () =>
    ({
      ...(THEMES[props.theme ?? 'dark'] ?? THEMES.dark),
      '--chroma-cols': Math.max(1, Math.round(props.columns ?? 3)),
      '--chroma-min': `${Math.max(80, props.minCardWidth ?? 180)}px`,
      '--chroma-gap': `${Math.max(0, props.gap ?? 12)}px`,
      '--chroma-r': `${Math.max(20, props.radius ?? 260)}px`,
      '--chroma-stops': falloffStops(clamp(props.softness ?? 0.6, 0, 1)),
      '--chroma-gray': clamp(props.grayscale ?? 1, 0, 1),
      '--chroma-dim': clamp(props.dim ?? 0.12, 0, 0.9),
      '--chroma-glow': clamp(props.glow ?? 0.5, 0, 1),
      '--chroma-border': clamp(props.borderGlow ?? 1, 0, 1),
      '--chroma-fade': `${Math.max(0, props.fadeOut ?? 0.6)}s`,
      '--chroma-ratio': props.aspectRatio ?? '3 / 2',
      '--chroma-radius': `${Math.max(0, props.cardRadius ?? 22)}px`,
      ...(props.frame
        ? {
            padding: '10px',
            'border-radius': 'calc(var(--chroma-radius) + 10px)',
            background: 'var(--chroma-frame)',
            'box-shadow': 'var(--chroma-frame-shadow)',
            '-webkit-backdrop-filter': 'blur(20px) saturate(1.6)',
            'backdrop-filter': 'blur(20px) saturate(1.6)',
          }
        : {}),
    }) as JSX.CSSProperties

  const washStyle = (): JSX.CSSProperties =>
    spotlight()
      ? {
          background: WASH,
          opacity: 'calc(var(--chroma-glow) * var(--chroma-power, 0) * 0.45)',
          '-webkit-mask-image': SPOT_MASK,
          'mask-image': SPOT_MASK,
        }
      : { background: WASH }
  const colorStyle = (): JSX.CSSProperties =>
    spotlight()
      ? {
          opacity: 'var(--chroma-power, 0)',
          '-webkit-mask-image': SPOT_MASK,
          'mask-image': SPOT_MASK,
        }
      : {}
  const glowStyle = (): JSX.CSSProperties =>
    spotlight()
      ? {
          'box-shadow': GLOW_RIM,
          opacity: 'calc(var(--chroma-border) * var(--chroma-power, 0))',
          '-webkit-mask-image': SPOT_MASK,
          'mask-image': SPOT_MASK,
        }
      : { 'box-shadow': GLOW_RIM }
  const fadeClass =
    'opacity-0 transition-opacity duration-[var(--chroma-fade)] ease-[ease] group-hover:duration-300'

  return (
    <div
      ref={root}
      class={`relative box-border w-full [-webkit-tap-highlight-color:transparent] ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={rootStyle()}
    >
      <div class="grid" style={{ gap: 'var(--chroma-gap)', 'grid-template-columns': GRID_COLUMNS }}>
        <For each={data()}>
          {item => {
            const accent = item.accent ?? item.borderColor ?? '#ffffff'
            const cardStyle = {
              '--chroma-accent': accent,
              'border-radius': 'var(--chroma-radius)',
              background: 'var(--chroma-tile)',
              'box-shadow': 'var(--chroma-tile-shadow)',
              color: 'var(--chroma-ink)',
            } as JSX.CSSProperties
            const inner = (
              <>
                <span
                  aria-hidden="true"
                  class={`pointer-events-none absolute inset-0 z-0 ${spotlight() ? '' : `${fadeClass} group-hover:opacity-[calc(var(--chroma-glow)*0.45)]`}`}
                  style={washStyle()}
                />
                <div
                  data-chroma-area=""
                  class="relative z-[1] overflow-hidden"
                  style={{
                    'aspect-ratio': 'var(--chroma-ratio)',
                    'border-radius': 'max(0px, calc(var(--chroma-radius) - 8px))',
                    background: 'var(--chroma-well)',
                  }}
                >
                  <img
                    class={IMAGE_CLASS}
                    style={{
                      filter:
                        'grayscale(var(--chroma-gray)) brightness(calc(1 - var(--chroma-dim)))',
                    }}
                    src={item.image}
                    alt={item.alt ?? item.title ?? ''}
                    loading="lazy"
                  />
                  <img
                    class={`${IMAGE_CLASS} ${spotlight() ? '' : `${fadeClass} group-hover:opacity-100`}`}
                    style={colorStyle()}
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                  <span
                    aria-hidden="true"
                    class="pointer-events-none absolute inset-0 rounded-[inherit]"
                    style={{ 'box-shadow': 'inset 0 0 0 1px var(--chroma-media-edge)' }}
                  />
                </div>
                {(props.showInfo ?? true) && (item.title || item.subtitle) && (
                  <div class="relative z-[1] flex min-w-0 flex-col gap-0.5 px-1.5 pt-0.5 pb-1">
                    {item.title && (
                      <span class="overflow-hidden text-[15px] leading-[1.3] font-semibold tracking-[-0.01em] text-ellipsis whitespace-nowrap">
                        {item.title}
                      </span>
                    )}
                    {item.subtitle && (
                      <span
                        class="overflow-hidden text-[13px] leading-[1.35] text-ellipsis whitespace-nowrap"
                        style={{ color: 'var(--chroma-muted)' }}
                      >
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                )}
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-0 z-[2] rounded-[inherit]"
                  style={{ 'box-shadow': TILE_RIM }}
                />
                <span
                  aria-hidden="true"
                  class={`pointer-events-none absolute inset-0 z-[2] rounded-[inherit] ${spotlight() ? '' : `${fadeClass} group-hover:opacity-[var(--chroma-border)]`}`}
                  style={glowStyle()}
                />
              </>
            )
            return item.url ? (
              <a
                data-chroma-area=""
                class={`${CARD_CLASS} active:[filter:var(--chroma-press)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:[outline-color:var(--chroma-ink)]`}
                style={cardStyle}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <article data-chroma-area="" class={CARD_CLASS} style={cardStyle}>
                {inner}
              </article>
            )
          }}
        </For>
      </div>
      {props.frame && (
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ 'box-shadow': FRAME_RIM }}
        />
      )}
    </div>
  )
}

export default ChromaGrid
