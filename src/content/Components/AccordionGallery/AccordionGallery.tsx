import { createEffect, createSignal, onCleanup } from 'solid-js'
import type { JSX } from 'solid-js'
import { Index } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { gsap } from 'gsap'

export interface AccordionGalleryItem {
  image: string
  label?: string
  link?: string
  alt?: string
}

export interface AccordionGalleryProps {
  items?: AccordionGalleryItem[]
  defaultIndex?: number
  accentColor?: string
  overlayColor?: string
  textColor?: string
  height?: number
  gap?: number
  radius?: number
  expandRatio?: number
  orientation?: 'horizontal' | 'vertical'
  duration?: number
  ease?: string
  parallax?: number
  tilt?: number
  stagger?: number
  trigger?: 'hover' | 'click'
  showLabels?: boolean
  grayscale?: boolean
  className?: string
}

const DEFAULT_ITEMS: AccordionGalleryItem[] = [
  { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon', link: '#' },
  { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline', link: '#' },
  { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls', link: '#' },
  { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour', link: '#' },
  { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline', link: '#' },
]

const AccordionGallery = (props: AccordionGalleryProps) => {
  const items = () => props.items ?? DEFAULT_ITEMS
  const vertical = () => props.orientation === 'vertical'
  const [active, setActive] = createSignal(
    Math.min(Math.max(props.defaultIndex ?? 2, 0), Math.max(items().length - 1, 0)),
  )

  let root!: HTMLDivElement
  const panelEls: (HTMLElement | null)[] = []
  const mediaEls: (HTMLElement | null)[] = []
  const barEls: (HTMLElement | null)[] = []
  const textEls: (HTMLElement | null)[] = []
  let tl: gsap.core.Timeline | null = null
  let firstRun = true
  let mediaSize = 320

  // Upstream read this once per render; the value is constant per session.
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const overlayBg = () =>
    `linear-gradient(180deg, transparent 45%, color-mix(in srgb, ${props.overlayColor ?? '#060010'} 78%, transparent) 100%), color-mix(in srgb, ${props.overlayColor ?? '#060010'} calc(var(--ag-dim, 0.35) * 100%), transparent)`

  const applyLayout = (animate: boolean) => {
    const panels = panelEls
    if (!panels.length) return

    const expandRatio = props.expandRatio ?? 0.52
    const duration = props.duration ?? 0.6
    const ease = props.ease ?? 'power3.out'
    const tilt = props.tilt ?? 8
    const parallax = props.parallax ?? 0.5
    const grayscale = props.grayscale ?? true
    const showLabels = props.showLabels ?? true
    const stagger = props.stagger ?? 0.06
    const n = items().length

    const r = Math.min(Math.max(expandRatio, 0.2), 0.9)
    const grow = n > 1 ? (r * (n - 1)) / (1 - r) : 1

    tl?.kill()
    const dur = animate && !prefersReduced ? duration : 0
    const next = gsap.timeline()

    panels.forEach((panel, i) => {
      if (!panel) return
      const isActive = i === active()
      const media = mediaEls[i]
      const bar = barEls[i]
      const text = textEls[i]

      const rot = isActive ? 0 : i < active() ? tilt : -tilt
      const rotProp = vertical() ? { rotateX: -rot } : { rotateY: rot }

      next.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease }, 0)

      if (media) {
        const drift = Math.max(-1.5, Math.min(1.5, active() - i))
        const shift = drift * parallax * mediaSize * 0.06
        const gray = grayscale ? (isActive ? 0 : 1) : 0
        next.to(
          media,
          {
            xPercent: -50,
            yPercent: -50,
            x: vertical() ? 0 : isActive ? 0 : shift,
            y: vertical() ? (isActive ? 0 : shift) : 0,
            '--ag-gray': gray,
            '--ag-dim': isActive ? 0 : 0.35,
            duration: dur,
            ease,
          },
          0,
        )
      }

      if (showLabels && bar && text) {
        if (isActive) {
          next.to(
            [bar, text],
            { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger },
            0,
          )
        } else {
          next.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0)
        }
      }
    })

    tl = next
  }

  // Upstream: applyLayout was rebuilt whenever active/visual props changed and
  // a layout effect replayed it. All of those inputs are reactive here.
  createEffect(() => {
    applyLayout(!firstRun)
    firstRun = false
    onCleanup(() => {
      tl?.kill()
      tl = null
    })
  })

  // Upstream: ResizeObserver effect on [applyLayout, gap, count, expandRatio, vertical].
  createEffect(() => {
    const el = root
    const gap = props.gap ?? 10
    const expandRatio = props.expandRatio ?? 0.52
    const vert = vertical()
    const n = items().length
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      const total = vert ? rect.height : rect.width
      const usable = Math.max(total - gap * (n - 1), 120)
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22)
      mediaSize = size
      el.style.setProperty('--ag-media-size', `${size}px`)
      applyLayout(!firstRun)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    onCleanup(() => ro.disconnect())
  })

  const handleEnter = (i: number) => {
    if ((props.trigger ?? 'hover') === 'hover') setActive(i)
  }

  const handleClick = (i: number, e: MouseEvent) => {
    if (i !== active()) {
      e.preventDefault()
      setActive(i)
    }
  }

  const handleKeyDown = (i: number, e: KeyboardEvent) => {
    const n = items().length
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i + 1) % n)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i - 1 + n) % n)
    }
  }

  return (
    <div
      ref={root}
      class={`flex ${vertical() ? 'flex-col' : 'flex-row'} w-full max-w-full [perspective:1400px] max-[520px]:!flex-col max-[520px]:[perspective:none] ${props.className ?? ''}`}
      style={{
        gap: `${props.gap ?? 10}px`,
        height: vertical()
          ? `${Math.round((props.height ?? 460) * 1.6)}px`
          : `${props.height ?? 460}px`,
      }}
      role="list"
      aria-label="Image accordion gallery"
    >
      <Index each={items()}>
        {(item, i) => {
          const isActive = () => i === active()
          return (
            <Dynamic
              component={item().link ? 'a' : 'div'}
              ref={(el: HTMLElement) => {
                panelEls[i] = el
              }}
              class="group relative block min-w-0 min-h-0 flex-[1_1_0] cursor-pointer overflow-hidden bg-[#0a0713] no-underline outline-none [transform-style:preserve-3d] [transform-origin:center] [box-shadow:0_10px_30px_-18px_rgba(0,0,0,0.8)] focus-visible:[box-shadow:0_0_0_2px_var(--ag-accent),0_10px_30px_-18px_rgba(0,0,0,0.8)] max-[520px]:min-h-[84px] max-[520px]:!transform-none"
              style={
                {
                  'border-radius': `${props.radius ?? 16}px`,
                  '--ag-accent': props.accentColor ?? '#ffffff',
                  'will-change': 'flex-grow, transform',
                } as JSX.CSSProperties
              }
              href={item().link || undefined}
              onClick={(e: MouseEvent) => handleClick(i, e)}
              onMouseEnter={() => handleEnter(i)}
              onFocus={() => setActive(i)}
              onKeyDown={(e: KeyboardEvent) => handleKeyDown(i, e)}
              role="listitem"
              tabIndex={0}
              aria-current={isActive() ? 'true' : undefined}
              aria-label={item().label}
            >
              <span class="absolute inset-0 overflow-hidden [border-radius:inherit]">
                <span
                  ref={(el: HTMLElement) => {
                    mediaEls[i] = el
                  }}
                  class="absolute top-1/2 left-1/2 [filter:grayscale(var(--ag-gray,1))]"
                  style={{
                    width: vertical() ? '100%' : 'var(--ag-media-size, 320px)',
                    height: vertical() ? 'var(--ag-media-size, 320px)' : '100%',
                    'will-change': 'transform, filter',
                  }}
                >
                  <img
                    src={item().image}
                    alt={item().alt || item().label || ''}
                    draggable={false}
                    class="block h-full w-full select-none object-cover [-webkit-user-drag:none]"
                  />
                </span>
                <span
                  class="pointer-events-none absolute inset-0"
                  style={{ background: overlayBg() }}
                  aria-hidden="true"
                />
              </span>
              {(props.showLabels ?? true) && (
                <span
                  class="pointer-events-none absolute bottom-5 left-5 right-5 z-[2] flex items-center gap-3"
                  aria-hidden="true"
                >
                  <span
                    ref={(el: HTMLElement) => {
                      barEls[i] = el
                    }}
                    class="h-[26px] w-[3px] flex-none rounded-[3px] opacity-0"
                    style={{
                      background: props.accentColor ?? '#ffffff',
                      'box-shadow': `0 0 12px color-mix(in srgb, ${props.accentColor ?? '#ffffff'} 60%, transparent)`,
                    }}
                  />
                  <span
                    ref={(el: HTMLElement) => {
                      textEls[i] = el
                    }}
                    class="overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1rem,1.4vw,1.4rem)] font-semibold tracking-[0.01em] opacity-0 [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]"
                    style={{ color: props.textColor ?? '#ffffff' }}
                  >
                    {item().label}
                  </span>
                </span>
              )}
            </Dynamic>
          )
        }}
      </Index>
    </div>
  )
}

export default AccordionGallery
