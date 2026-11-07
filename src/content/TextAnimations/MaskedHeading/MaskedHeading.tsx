import {
  createEffect,
  createMemo,
  createUniqueId,
  For,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { Show } from 'solid-js'
import { gsap } from 'gsap'

const clamp = (v: number, a: number, b: number): number => (v < a ? a : Math.min(v, b))

const SPOT_MASK = `radial-gradient(circle var(--mh-spot-r, 160px) at var(--mh-spot-x, 50%) var(--mh-spot-y, 50%), ${Array.from(
  { length: 9 },
  (_, i) => {
    const t = i / 8
    const u = clamp((t - 0.1) / 0.9, 0, 1)
    return `rgba(0, 0, 0, ${(u * u * u * (u * (u * 6 - 15) + 10)).toFixed(3)}) ${(t * 100).toFixed(1)}%`
  },
).join(', ')})`

type Reveal = 'rise' | 'scale' | 'blur' | 'wipe' | 'fade' | 'none'
type Trigger = 'view' | 'mount' | 'hover'

export interface MaskedHeadingProps {
  text?: string
  tag?: keyof JSX.IntrinsicElements
  mediaType?: 'image' | 'video'
  src?: string
  poster?: string
  fillScale?: number
  parallax?: number
  drift?: number
  hoverZoom?: number
  brightness?: number
  saturation?: number
  grayscale?: boolean
  tint?: string
  spotlight?: boolean
  spotlightRadius?: number
  outline?: boolean
  outlineColor?: string
  outlineWidth?: number
  reveal?: Reveal
  duration?: number
  stagger?: number
  trigger?: Trigger
  align?: 'left' | 'center' | 'right'
  weight?: number
  tracking?: number
  lineHeight?: number
  textScale?: number
  className?: string
  class?: string
  style?: JSX.CSSProperties
  /** Upstream allowed arbitrary passthrough props (data-*, aria-*, event handlers). */
  [key: string]: unknown
}

interface Settings {
  fillScale: number
  parallax: number
  drift: number
  hoverZoom: number
  brightness: number
  saturation: number
  grayscale: boolean
  textScale: number
  spotlight: boolean
}

interface GlyphBox {
  x: number
  y: number
  w: number
  cx: number
  cy: number
  lc: number
}

interface GlyphState {
  x: number
  y: number
  s: number
}

const MaskedHeading = (props: MaskedHeadingProps) => {
  const [own, rest] = splitProps(props, [
    'text',
    'tag',
    'mediaType',
    'src',
    'poster',
    'fillScale',
    'parallax',
    'drift',
    'hoverZoom',
    'brightness',
    'saturation',
    'grayscale',
    'tint',
    'spotlight',
    'spotlightRadius',
    'outline',
    'outlineColor',
    'outlineWidth',
    'reveal',
    'duration',
    'stagger',
    'trigger',
    'align',
    'weight',
    'tracking',
    'lineHeight',
    'textScale',
    'className',
    'class',
    'style',
  ])

  let rootEl!: HTMLElement
  let measureEl!: HTMLSpanElement
  let revealEl!: HTMLSpanElement
  let clipEl!: HTMLSpanElement
  let mediaEl!: HTMLSpanElement
  const wordEls: (HTMLSpanElement | null)[] = []
  const baseEls: (HTMLElement | null)[] = []
  const glyphEls: (SVGTextElement | null)[] = []
  const lineEls: (SVGTextElement | null)[] = []
  let boxes: GlyphBox[] = []
  let states: GlyphState[] = []
  let tween: gsap.core.Animation | null = null
  const offset = { x: 0, y: 0, tx: 0, ty: 0, zoom: 0, px: 0, py: 0, sx: 0, sy: 0, lit: false }
  const paint = { transform: '', filter: '', spot: '' }
  const wakeRef: { current: () => void } = { current: () => {} }

  const clipId = `mh-${createUniqueId()}`
  const textValue = () => own.text ?? 'Designed in the details'
  const words = createMemo(() => String(textValue()).split(/\s+/).filter(Boolean))
  const glyphs = createMemo(() =>
    words().flatMap((word, w) => Array.from(word).map(char => ({ char, w }))),
  )

  const fillScale = () => own.fillScale ?? 1.25
  const parallax = () => own.parallax ?? 26
  const drift = () => own.drift ?? 18
  const hoverZoom = () => own.hoverZoom ?? 0
  const brightness = () => own.brightness ?? 1
  const saturation = () => own.saturation ?? 1
  const grayscale = () => own.grayscale ?? false
  const textScale = () => own.textScale ?? 0.115
  const spotlight = () => own.spotlight ?? false
  const outline = () => own.outline ?? false
  const spotlightRadius = () => own.spotlightRadius ?? 160
  const reveal = () => own.reveal ?? 'rise'
  const trigger = () => own.trigger ?? 'view'
  const duration = () => own.duration ?? 1.1
  const stagger = () => own.stagger ?? 0.09
  const align = () => own.align ?? 'center'
  const weight = () => own.weight ?? 700
  const tracking = () => own.tracking ?? -0.03
  const lineHeight = () => own.lineHeight ?? 1.06

  // Upstream rebuilt settingsRef on every render.
  let settings: Settings = {
    fillScale: fillScale(),
    parallax: parallax(),
    drift: drift(),
    hoverZoom: hoverZoom(),
    brightness: brightness(),
    saturation: saturation(),
    grayscale: grayscale(),
    textScale: textScale(),
    spotlight: spotlight(),
  }
  createEffect(() => {
    settings = {
      fillScale: fillScale(),
      parallax: parallax(),
      drift: drift(),
      hoverZoom: hoverZoom(),
      brightness: brightness(),
      saturation: saturation(),
      grayscale: grayscale(),
      textScale: textScale(),
      spotlight: spotlight(),
    }
    wakeRef.current()
  })

  const place = () => {
    const root = rootEl
    const media = mediaEl
    if (!root || !media) return
    const s = settings
    const off = offset
    const scale = s.fillScale * (1 + Math.max(0, off.zoom))
    const maxX = Math.max(0, ((scale - 1) / 2) * root.clientWidth)
    const maxY = Math.max(0, ((scale - 1) / 2) * root.clientHeight)

    const transform = `translate3d(${clamp(off.x, -maxX, maxX).toFixed(2)}px, ${clamp(off.y, -maxY, maxY).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
    const filter = `brightness(${s.brightness}) saturate(${s.saturation})${s.grayscale ? ' grayscale(1)' : ''}`
    if (paint.transform !== transform) {
      paint.transform = transform
      media.style.transform = transform
    }
    if (paint.filter !== filter) {
      paint.filter = filter
      media.style.filter = filter
    }

    const clip = clipEl
    if (clip && s.spotlight) {
      const spot = `${off.sx.toFixed(1)}px ${off.sy.toFixed(1)}px`
      if (paint.spot !== spot) {
        paint.spot = spot
        clip.style.setProperty('--mh-spot-x', `${off.sx.toFixed(1)}px`)
        clip.style.setProperty('--mh-spot-y', `${off.sy.toFixed(1)}px`)
      }
    }
  }

  const renderGlyphs = () => {
    for (let i = 0; i < glyphEls.length; i += 1) {
      const glyph = glyphEls[i]
      if (!glyph) continue
      const box = boxes[i]
      const st = states[i]
      if (!box || !st || (st.x === 0 && st.y === 0 && st.s === 1)) {
        if (glyph.hasAttribute('transform')) glyph.removeAttribute('transform')
        continue
      }
      const s = Math.max(st.s, 0.0001)
      const tx = box.cx * (1 - s) + st.x * (box.cx - box.lc)
      const ty = box.cy * (1 - s) + st.y
      glyph.setAttribute(
        'transform',
        `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`,
      )
    }
  }

  const sync = () => {
    const root = rootEl
    const measure = measureEl
    if (!root || !measure) return
    const s = settings

    root.style.fontSize = `${clamp(root.clientWidth * s.textScale, 20, 200).toFixed(1)}px`

    const cs = window.getComputedStyle(measure)
    const fontPx = parseFloat(cs.fontSize) || 48
    const rootRect = root.getBoundingClientRect()
    const ratio = root.offsetWidth ? rootRect.width / root.offsetWidth || 1 : 1
    const range = document.createRange()
    const nextBoxes: GlyphBox[] = []
    let index = 0

    for (let w = 0; w < wordEls.length; w += 1) {
      const box = wordEls[w]
      const base = baseEls[w]
      // Solid wraps interpolated text in comment markers, so the word's text
      // node is NOT necessarily firstChild (React could assume it was).
      const node = box
        ? ([...box.childNodes].find((n): n is Text => n.nodeType === 3) ?? null)
        : null
      if (!box || !base || !node) {
        index += Array.from(box?.textContent ?? '').length
        continue
      }
      const boxRect = box.getBoundingClientRect()
      const baseline = base.offsetTop
      let charOffset = 0
      for (const char of Array.from(node.data)) {
        range.setStart(node, charOffset)
        range.setEnd(node, charOffset + char.length)
        charOffset += char.length
        const r = range.getBoundingClientRect()
        const x = box.offsetLeft + (r.left - boxRect.left) / ratio
        const width = r.width / ratio
        nextBoxes[index] = {
          x,
          y: baseline,
          w: width,
          cx: x + width / 2,
          cy: baseline - fontPx * 0.36,
          lc: 0,
        }
        index += 1
      }
    }
    const lines = new Map<number, { left: number; right: number }>()
    for (const box of nextBoxes) {
      if (!box) continue
      const line = lines.get(box.y) ?? { left: Infinity, right: -Infinity }
      line.left = Math.min(line.left, box.x)
      line.right = Math.max(line.right, box.x + box.w)
      lines.set(box.y, line)
    }
    for (const box of nextBoxes) {
      if (!box) continue
      const line = lines.get(box.y)
      if (line) box.lc = (line.left + line.right) / 2
    }
    boxes = nextBoxes

    const write = (el: SVGTextElement) => {
      if (!el) return
      el.style.fontFamily = cs.fontFamily
      el.style.fontSize = cs.fontSize
      el.style.fontWeight = cs.fontWeight
      el.style.fontStyle = cs.fontStyle
      el.style.letterSpacing = cs.letterSpacing
    }
    for (let i = 0; i < nextBoxes.length; i += 1) {
      const box = nextBoxes[i]
      for (const el of [glyphEls[i], lineEls[i]]) {
        if (!el || !box) continue
        el.setAttribute('x', box.x.toFixed(2))
        el.setAttribute('y', `${box.y}`)
        write(el)
      }
    }
    renderGlyphs()
    place()
  }

  onMount(() => {
    const root = rootEl
    if (!root) return

    let alive = true
    const ro = new ResizeObserver(() => sync())
    ro.observe(root)
    // Re-measure once the first paint settles and again after webfonts land —
    // the initial sync can run before layout has final glyph metrics.
    let syncRaf = 0
    const syncOnFrame = () => {
      if (syncRaf) cancelAnimationFrame(syncRaf)
      syncRaf = requestAnimationFrame(() => {
        syncRaf = 0
        if (alive) sync()
      })
    }
    syncOnFrame()
    if (document.fonts?.ready) document.fonts.ready.then(() => alive && syncOnFrame()).catch(() => {})

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const off = offset
    let raf = 0
    let last = 0
    let clock = 0
    let visible = true
    let hovering = false

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const s = settings
      const still = !!motionQuery?.matches

      if (still) {
        off.x = 0
        off.y = 0
        off.zoom = 0
      } else {
        clock += dt
        const dx = Math.sin(clock * 0.21) * s.drift
        const dy = Math.cos(clock * 0.17) * s.drift * 0.6
        const ease = 1 - Math.exp(-dt / 0.18)
        off.x += (off.tx + dx - off.x) * ease
        off.y += (off.ty + dy - off.y) * ease
        off.zoom += ((hovering ? s.hoverZoom : 0) - off.zoom) * (1 - Math.exp(-dt / 0.35))
      }

      if (s.spotlight) {
        const w = root.clientWidth
        const h = root.clientHeight
        let gx = w / 2
        let gy = h / 2
        if (hovering) {
          gx = off.px
          gy = off.py
        } else if (!still) {
          gx = w * (0.5 + 0.36 * Math.sin(clock * 0.37))
          gy = h * (0.5 + 0.22 * Math.sin(clock * 0.61 + 0.9))
        }
        if (!off.lit || still) {
          off.sx = gx
          off.sy = gy
          off.lit = true
        } else {
          const follow = 1 - Math.exp(-dt / (hovering ? 0.12 : 0.6))
          off.sx += (gx - off.sx) * follow
          off.sy += (gy - off.sy) * follow
        }
      } else {
        off.lit = false
      }

      place()
      if (visible && !still && alive) raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (raf || !alive) return
      last = 0
      raf = requestAnimationFrame(frame)
    }
    wakeRef.current = wake

    const onMove = (e: PointerEvent) => {
      const s = settings
      const r = root.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / (r.width || 1)) * 2 - 1
      const ny = ((e.clientY - r.top) / (r.height || 1)) * 2 - 1
      off.tx = clamp(nx, -1, 1) * -Math.max(0, s.parallax)
      off.ty = clamp(ny, -1, 1) * -Math.max(0, s.parallax)
      off.px = ((e.clientX - r.left) / (r.width || 1)) * root.clientWidth
      off.py = ((e.clientY - r.top) / (r.height || 1)) * root.clientHeight
      if (s.spotlight) wake()
    }

    const onEnter = (e: PointerEvent) => {
      hovering = e.pointerType !== 'touch'
      onMove(e)
      wake()
    }

    const onLeave = () => {
      hovering = false
      off.tx = 0
      off.ty = 0
      wake()
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
    })
    io.observe(root)

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerenter', onEnter)
    root.addEventListener('pointerleave', onLeave)
    wake()

    onCleanup(() => {
      alive = false
      cancelAnimationFrame(raf)
      raf = 0
      if (syncRaf) cancelAnimationFrame(syncRaf)
      wakeRef.current = () => {}
      ro.disconnect()
      io.disconnect()
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerenter', onEnter)
      root.removeEventListener('pointerleave', onLeave)
    })
  })

  createEffect(() => {
    // Upstream deps: [mediaType, src]
    const mediaType = own.mediaType ?? 'image'
    const src = own.src ?? ''
    if (mediaType === 'video' && src) {
      untrack(() => {
        const video = mediaEl?.querySelector('video')
        if (video && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) video.pause()
      })
    }
  })

  createEffect(() => {
    // Upstream deps: [sync, words, tag, align, weight, tracking, lineHeight,
    // textScale, outline]
    words()
    void own.tag
    align()
    weight()
    tracking()
    lineHeight()
    textScale()
    outline()
    untrack(() => sync())
  })

  createEffect(() => {
    // Upstream deps: [reveal, trigger, duration, stagger, glyphs, renderGlyphs]
    const revealNow = reveal()
    const triggerNow = trigger()
    const durationNow = duration()
    const staggerNow = stagger()
    const glyphList = glyphs()
    const root = rootEl
    const layer = revealEl
    if (!root || !layer) return
    const nextStates: GlyphState[] = glyphList.map(() => ({ x: 0, y: 0, s: 1 }))
    states = nextStates
    if (!nextStates.length) return

    const em = () => parseFloat(window.getComputedStyle(root).fontSize) || 48
    const wordDelay = (i: number) => glyphList[i].w * staggerNow
    const letterDelay = (i: number) => i * staggerNow * 0.35

    const clearLayer = () => {
      gsap.set(layer, { opacity: 1, scale: 1 })
      layer.style.clipPath = ''
      layer.style.filter = ''
    }

    const settle = () => {
      nextStates.forEach(st => {
        st.x = 0
        st.y = 0
        st.s = 1
      })
      renderGlyphs()
      clearLayer()
    }

    const rest = () => {
      const size = em()
      if (revealNow === 'rise') {
        nextStates.forEach(st => {
          st.y = size * 1.15
        })
      } else if (revealNow === 'scale') {
        nextStates.forEach(st => {
          st.y = size * 0.1
          st.s = 0
        })
      } else if (revealNow === 'blur') {
        nextStates.forEach(st => {
          st.x = 0.22
        })
        gsap.set(layer, { opacity: 0 })
        layer.style.filter = `blur(${(size * 0.3).toFixed(2)}px)`
      } else if (revealNow === 'wipe') {
        layer.style.clipPath = 'inset(0% 100% 0% 0%)'
      } else if (revealNow === 'fade') {
        gsap.set(layer, { opacity: 0, scale: 1.08 })
      }
      renderGlyphs()
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (revealNow === 'none' || reduce) {
      settle()
      return
    }

    const play = () => {
      tween?.kill()
      const size = em()
      if (revealNow === 'rise') {
        clearLayer()
        tween = gsap.fromTo(
          nextStates,
          { x: 0, y: size * 1.15, s: 1 },
          {
            y: 0,
            duration: durationNow,
            stagger: wordDelay,
            ease: 'power4.out',
            overwrite: 'auto',
            onUpdate: renderGlyphs,
          },
        )
        renderGlyphs()
      } else if (revealNow === 'scale') {
        clearLayer()
        tween = gsap.fromTo(
          nextStates,
          { x: 0, y: size * 0.1, s: 0 },
          {
            y: 0,
            s: 1,
            duration: durationNow,
            stagger: letterDelay,
            ease: 'expo.out',
            overwrite: 'auto',
            onUpdate: renderGlyphs,
          },
        )
        renderGlyphs()
      } else if (revealNow === 'blur') {
        const focus = { blur: size * 0.3, opacity: 0 }
        gsap.set(layer, { scale: 1, opacity: 0 })
        layer.style.clipPath = ''
        layer.style.filter = `blur(${focus.blur.toFixed(2)}px)`
        const timeline = gsap.timeline({ onUpdate: renderGlyphs })
        timeline.fromTo(
          nextStates,
          { x: 0.22, y: 0, s: 1 },
          { x: 0, duration: durationNow * 1.2, ease: 'expo.out' },
          0,
        )
        timeline.to(
          focus,
          {
            blur: 0,
            opacity: 1,
            duration: durationNow * 1.2,
            ease: 'power2.out',
            onUpdate: () => {
              layer.style.filter = focus.blur > 0.05 ? `blur(${focus.blur.toFixed(2)}px)` : ''
              layer.style.opacity = focus.opacity.toFixed(3)
            },
          },
          0,
        )
        tween = timeline
        renderGlyphs()
      } else if (revealNow === 'wipe') {
        settle()
        layer.style.clipPath = 'inset(0% 100% 0% 0%)'
        const state = { p: 100 }
        tween = gsap.to(state, {
          p: 0,
          duration: durationNow,
          ease: 'power3.inOut',
          overwrite: 'auto',
          onUpdate: () => {
            layer.style.clipPath = `inset(0% ${state.p}% 0% 0%)`
          },
        })
      } else {
        settle()
        tween = gsap.fromTo(
          layer,
          { opacity: 0, scale: 1.08 },
          { opacity: 1, scale: 1, duration: durationNow, ease: 'power3.out', overwrite: 'auto' },
        )
      }
    }

    if (triggerNow === 'hover') {
      settle()
      root.addEventListener('pointerenter', play)
      onCleanup(() => {
        root.removeEventListener('pointerenter', play)
        tween?.kill()
      })
      return
    }

    if (triggerNow === 'view') {
      settle()
      rest()
      const io = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            play()
            io.disconnect()
          }
        },
        { threshold: 0.25 },
      )
      io.observe(root)
      onCleanup(() => {
        io.disconnect()
        tween?.kill()
      })
      return
    }

    play()
    onCleanup(() => tween?.kill())
  })

  return (
    <Dynamic
      component={(own.tag ?? 'h2') as 'h2'}
      ref={(el: HTMLHeadingElement) => (rootEl = el)}
      class={`relative w-full m-0 p-0 antialiased [text-wrap:balance] ${own.class ?? ''} ${own.className ?? ''}`.trim()}
      style={{
        'text-align': align(),
        'font-weight': weight(),
        'letter-spacing': `${tracking()}em`,
        'line-height': lineHeight(),
        ...own.style,
      }}
      // Upstream typed extras as `[key: string]: unknown` passthrough; narrowed
      // to the heading attribute shape for the JSX spread.
      {...(rest as unknown as JSX.HTMLAttributes<HTMLHeadingElement>)}
    >
      <span ref={measureEl} class="text-transparent">
        <For each={words()}>
          {(word, i) => (
            <span
              ref={(el: HTMLSpanElement) => {
                wordEls[i()] = el
                onCleanup(() => {
                  if (wordEls[i()] === el) wordEls[i()] = null
                })
              }}
              class="inline-block whitespace-pre [&:not(:last-child)]:after:content-['_']"
            >
              {word}
              <i
                ref={(el: HTMLElement) => {
                  baseEls[i()] = el
                  onCleanup(() => {
                    if (baseEls[i()] === el) baseEls[i()] = null
                  })
                }}
                class="inline-block w-0 h-0"
              />
            </span>
          )}
        </For>
      </span>

      <svg class="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <For each={glyphs()}>
              {(glyph, i) => (
                <text
                  ref={(el: SVGTextElement) => {
                    glyphEls[i()] = el
                    onCleanup(() => {
                      if (glyphEls[i()] === el) glyphEls[i()] = null
                    })
                  }}
                >
                  {glyph.char}
                </text>
              )}
            </For>
          </clipPath>
        </defs>
      </svg>

      <span ref={revealEl} class="absolute inset-0 block pointer-events-none">
        <span
          ref={clipEl}
          class="absolute inset-0 block"
          style={{
            'clip-path': `url(#${clipId})`,
            '--mh-spot-r': `${Math.max(1, spotlightRadius())}px`,
          }}
        >
          <span
            ref={mediaEl}
            class="absolute inset-0 block [background:color-mix(in_srgb,currentColor_10%,transparent)] [will-change:transform,filter]"
          >
            <Show
              when={own.mediaType === 'video'}
              fallback={
                <img
                  class="block w-full h-full object-cover select-none"
                  src={own.src || undefined}
                  alt=""
                  draggable={false}
                />
              }
            >
              <video
                class="block w-full h-full object-cover select-none"
                src={own.src || undefined}
                poster={own.poster || undefined}
                autoplay
                muted
                loop
                playsinline
              />
            </Show>
          </span>
          <Show when={own.tint}>
            <span
              class="absolute inset-0 block mix-blend-color pointer-events-none"
              style={{ background: own.tint }}
            />
          </Show>
          <Show when={spotlight()}>
            <span
              class="absolute inset-0 block pointer-events-none bg-[#808080] mix-blend-saturation"
              style={{ 'mask-image': SPOT_MASK, '-webkit-mask-image': SPOT_MASK }}
            />
            <span
              class="absolute inset-0 block pointer-events-none bg-black opacity-55"
              style={{ 'mask-image': SPOT_MASK, '-webkit-mask-image': SPOT_MASK }}
            />
          </Show>
        </span>
      </span>

      <Show when={outline()}>
        <svg
          class="absolute inset-0 w-full h-full overflow-visible pointer-events-none fill-none [stroke-linejoin:round]"
          aria-hidden="true"
          style={{
            stroke: own.outlineColor || 'currentColor',
            'stroke-width': Math.max(0, own.outlineWidth ?? 1),
          }}
        >
          <For each={glyphs()}>
            {(glyph, i) => (
              <text
                ref={(el: SVGTextElement) => {
                  lineEls[i()] = el
                  onCleanup(() => {
                    if (lineEls[i()] === el) lineEls[i()] = null
                  })
                }}
              >
                {glyph.char}
              </text>
            )}
          </For>
        </svg>
      </Show>
    </Dynamic>
  )
}

export default MaskedHeading
