import { children as childrenHelper, createEffect, createMemo, For, onCleanup } from 'solid-js'
import type { JSX } from 'solid-js'

export interface ScrollStackItemProps {
  children?: JSX.Element
  itemClassName?: string
  style?: JSX.CSSProperties
}

export interface ScrollStackProps {
  children?: JSX.Element
  class?: string
  className?: string
  itemDistance?: number
  itemStackDistance?: number
  stackPosition?: number | string
  itemScale?: number
  baseScale?: number
  dimAmount?: number
  blurAmount?: number
  tiltAmount?: number
  rotationAmount?: number
  holdDistance?: number
  smoothScroll?: boolean
  snap?: boolean
  useWindowScroll?: boolean
  onStackComplete?: () => void
}

interface StackSettings {
  itemDistance: number
  itemStackDistance: number
  stackPosition: number | string
  itemScale: number
  baseScale: number
  dimAmount: number
  blurAmount: number
  tiltAmount: number
  rotationAmount: number
  holdDistance: number
  smoothScroll: boolean
  snap: boolean
  onStackComplete?: () => void
}

const resolveOffset = (value: number | string, size: number) => {
  if (typeof value === 'number') return value
  const text = String(value).trim()
  if (text.endsWith('%')) return (parseFloat(text) / 100) * size
  return parseFloat(text) || 0
}

const toLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

const scrollsInside = (node: Element | null, stop: Element, delta: number) => {
  for (
    let element: Element | null = node;
    element && element !== stop;
    element = element.parentElement
  ) {
    if (element.scrollHeight <= element.clientHeight + 1) continue
    const overflow = getComputedStyle(element).overflowY
    if (overflow !== 'auto' && overflow !== 'scroll') continue
    if (
      delta > 0
        ? element.scrollTop + element.clientHeight < element.scrollHeight - 1
        : element.scrollTop > 0
    ) {
      return true
    }
  }
  return false
}

const CARD_SHADOW = [
  '0 0 0 1px light-dark(rgb(0 0 0 / 0.06), rgb(255 255 255 / 0.08))',
  '0 -12px 40px -16px rgb(0 0 0 / 0.35)',
  '0 24px 48px -24px rgb(0 0 0 / 0.4)',
].join(', ')

export const ScrollStackItem = (props: ScrollStackItemProps) => (
  <div
    class={`relative box-border h-80 w-full origin-top rounded-[28px] p-10 [background:light-dark(#ffffff,#18181b)] [color:light-dark(#18181b,#fafafa)] will-change-transform ${props.itemClassName ?? ''}`.trim()}
    style={{ 'box-shadow': CARD_SHADOW, ...props.style }}
  >
    {props.children}
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-[inherit] bg-black opacity-[var(--scroll-stack-dim,0)]"
    />
  </div>
)

const ScrollStack = (props: ScrollStackProps) => {
  let rootRef!: HTMLDivElement
  let innerRef!: HTMLDivElement
  let endRef!: HTMLDivElement
  let settings: StackSettings | null = null
  let schedule: (() => void) | null = null

  const resolved = childrenHelper(() => props.children)
  const items = createMemo<unknown[]>(() => {
    const c = resolved()
    return Array.isArray(c) ? c : [c]
  })

  // Settings mirror refreshed per reactive change, then re-schedule — mirrors
  // upstream's every-render useLayoutEffect.
  createEffect(() => {
    settings = {
      itemDistance: props.itemDistance ?? 100,
      itemStackDistance: props.itemStackDistance ?? 24,
      stackPosition: props.stackPosition ?? '15%',
      itemScale: props.itemScale ?? 0.05,
      baseScale: props.baseScale ?? 0.8,
      dimAmount: props.dimAmount ?? 0.2,
      blurAmount: props.blurAmount ?? 0,
      tiltAmount: props.tiltAmount ?? 0,
      rotationAmount: props.rotationAmount ?? 0,
      holdDistance: props.holdDistance ?? 200,
      smoothScroll: props.smoothScroll ?? true,
      snap: props.snap ?? false,
      onStackComplete: props.onStackComplete,
    }
    schedule?.()
  })

  createEffect(() => {
    const useWindowScroll = props.useWindowScroll ?? false
    void useWindowScroll

    const root = rootRef
    const inner = innerRef
    const end = endRef
    if (!root || !inner || !end) return

    const windowed = useWindowScroll
    const target: Window | HTMLDivElement = windowed ? window : root
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cache = new Map<string, string | number>()
    let frame = 0
    let glide = 0
    let rest = 0
    let complete = false
    let gliding = false
    let pressed = false
    let current = 0
    let goal = 0
    let written = 0
    let last = 0
    let points: number[] = []
    let reach = 0

    const readScroll = () => (windowed ? window.scrollY : root.scrollTop)
    const maxScroll = () =>
      windowed
        ? document.documentElement.scrollHeight - window.innerHeight
        : root.scrollHeight - root.clientHeight
    const writeScroll = (value: number) => {
      written = value
      target.scrollTo({ top: value, behavior: 'instant' as ScrollBehavior })
    }

    const write = <T extends string | number>(key: string, value: T, apply: (value: T) => void) => {
      if (cache.get(key) === value) return false
      cache.set(key, value)
      apply(value)
      return true
    }

    const update = () => {
      frame = 0
      const s = settings
      const slots = (Array.from(inner.children) as HTMLElement[]).filter(child =>
        child.hasAttribute('data-stack-slot'),
      )
      if (!s || !slots.length) return

      const viewHeight = windowed ? window.innerHeight : root.clientHeight
      const viewTop = windowed ? 0 : root.getBoundingClientRect().top + root.clientTop
      const stackTop = resolveOffset(s.stackPosition, viewHeight)
      const offset = s.itemStackDistance
      const heights = slots.map(slot => slot.offsetHeight)
      const tops = slots.map(slot => slot.getBoundingClientRect().top)
      const lastPin = stackTop + (slots.length - 1) * offset
      const padTop = windowed ? 0 : stackTop
      const endHeight =
        s.holdDistance +
        (windowed ? 0 : Math.max(0, viewHeight - lastPin - heights[heights.length - 1]))

      let moved = write('padTop', padTop, value => {
        inner.style.paddingTop = `${value}px`
      })
      moved =
        write('endHeight', endHeight, value => {
          end.style.height = `${value}px`
        }) || moved

      let flow = inner.getBoundingClientRect().top - viewTop + readScroll() + padTop
      points = heights.map((height, i) => {
        const point = flow - stackTop - i * offset
        flow += height + s.itemDistance
        return point
      })
      reach = Math.max(40, (heights[0] + s.itemDistance - offset) / 2)

      const depths = slots.map(() => 0)
      let lastCover = 0
      for (let j = 1; j < slots.length; j++) {
        const pinBefore = viewTop + stackTop + (j - 1) * offset
        const start = pinBefore + heights[j - 1]
        const span = Math.max(1, start - pinBefore - offset)
        const cover = Math.min(1, Math.max(0, (start - tops[j]) / span))
        for (let i = 0; i < j; i++) depths[i] += cover
        lastCover = cover
      }

      const dimStep = Math.min(Math.max(s.dimAmount, 0), 1)
      slots.forEach((slot, i) => {
        const card = slot.firstElementChild as HTMLElement | null
        if (!card) return
        const depth = depths[i]
        const lean = Math.min(depth, 1)
        const scale = Math.max(Math.min(s.baseScale, 1), 1 - depth * s.itemScale)
        const tilt = -lean * s.tiltAmount
        const turn = lean * s.rotationAmount * (i % 2 ? -1 : 1)
        const blur = depth * s.blurAmount
        const dim = 1 - (1 - dimStep) ** depth
        const transform =
          depth < 0.0005
            ? ''
            : `perspective(1200px) rotateX(${tilt.toFixed(2)}deg) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`
        write(`transform${i}`, transform, value => {
          card.style.transform = value
        })
        write(`filter${i}`, blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : '', value => {
          card.style.filter = value
        })
        write(`dim${i}`, dim.toFixed(3), value => {
          card.style.setProperty('--scroll-stack-dim', value)
        })
      })

      const done = slots.length > 1 && lastCover >= 0.999
      if (done !== complete) {
        complete = done
        if (done) s.onStackComplete?.()
      }

      if (moved) scheduleNow()
    }

    const scheduleNow = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (Math.abs(readScroll() - written) > 2) {
        gliding = false
        glide = 0
        settleSoon()
        return
      }
      current += (goal - current) * (1 - 0.9 ** (dt * 60))
      if (Math.abs(goal - current) < 0.5) current = goal
      writeScroll(current)
      if (current === goal) {
        gliding = false
        glide = 0
        settleSoon()
        return
      }
      glide = requestAnimationFrame(step)
    }

    const glideTo = (value: number) => {
      goal = Math.min(Math.max(value, 0), maxScroll())
      if (media.matches) {
        writeScroll(goal)
        return
      }
      if (gliding) return
      gliding = true
      current = readScroll()
      written = current
      last = performance.now()
      glide = requestAnimationFrame(step)
    }

    const settle = () => {
      rest = 0
      if (!settings?.snap || gliding || pressed || !points.length) return
      const now = readScroll()
      const nearest = points.reduce((best, point) =>
        Math.abs(point - now) < Math.abs(best - now) ? point : best,
      )
      const gap = Math.abs(nearest - now)
      if (gap > 1 && gap < reach) glideTo(nearest)
    }

    const settleSoon = () => {
      window.clearTimeout(rest)
      rest = window.setTimeout(settle, 140)
    }

    const onScroll = () => {
      scheduleNow()
      if (!gliding) settleSoon()
    }

    const onWheel = (input: Event) => {
      const event = input as WheelEvent
      if (!settings?.smoothScroll || media.matches || event.defaultPrevented || event.ctrlKey)
        return
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const page = windowed ? window.innerHeight : root.clientHeight
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1)
      if (
        !delta ||
        scrollsInside(event.target as Element | null, windowed ? document.body : root, delta)
      )
        return
      const base = gliding ? goal : readScroll()
      if ((delta < 0 && base <= 0) || (delta > 0 && base >= maxScroll() - 0.5)) return
      event.preventDefault()
      window.clearTimeout(rest)
      glideTo(base + delta)
    }

    const onPress = () => {
      pressed = true
      window.clearTimeout(rest)
    }

    const onRelease = () => {
      if (!pressed) return
      pressed = false
      settleSoon()
    }

    const onResize = () => scheduleNow()
    const observer = new ResizeObserver(() => scheduleNow())
    observer.observe(root)
    observer.observe(inner)
    target.addEventListener('scroll', onScroll, { passive: true })
    target.addEventListener('wheel', onWheel, { passive: false })
    target.addEventListener('pointerdown', onPress, { passive: true })
    window.addEventListener('pointerup', onRelease, { passive: true })
    window.addEventListener('pointercancel', onRelease, { passive: true })
    window.addEventListener('resize', onResize)
    schedule = scheduleNow
    update()

    onCleanup(() => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(glide)
      window.clearTimeout(rest)
      observer.disconnect()
      target.removeEventListener('scroll', onScroll)
      target.removeEventListener('wheel', onWheel)
      target.removeEventListener('pointerdown', onPress)
      window.removeEventListener('pointerup', onRelease)
      window.removeEventListener('pointercancel', onRelease)
      window.removeEventListener('resize', onResize)
      schedule = null
    })
  })

  const count = () => items().length

  return (
    <div
      ref={rootRef}
      class={`relative w-full ${(props.useWindowScroll ?? false) ? '' : 'h-full overflow-x-hidden overflow-y-auto'} ${props.class ?? ''} ${props.className ?? ''}`.trim()}
    >
      <div ref={innerRef} class="relative px-[clamp(1rem,6%,5rem)]">
        <For each={items()}>
          {(_, index) => {
            const gap = () =>
              (props.itemDistance ?? 100) - (count() - index()) * (props.itemStackDistance ?? 24)
            return (
              <>
                {index() > 0 && (
                  <div
                    aria-hidden="true"
                    style={{
                      height: `${Math.max(0, gap())}px`,
                      'margin-top': `${Math.min(0, gap())}px`,
                    }}
                  />
                )}
                <div
                  data-stack-slot=""
                  class="sticky"
                  style={{
                    top: `calc(${toLength(props.stackPosition ?? '15%')} + ${index() * (props.itemStackDistance ?? 24)}px)`,
                    'margin-bottom': `${(count() - 1 - index()) * (props.itemStackDistance ?? 24)}px`,
                    'z-index': index() + 1,
                  }}
                >
                  {items()[index()] as JSX.Element}
                </div>
              </>
            )
          }}
        </For>
        <div ref={endRef} aria-hidden="true" />
      </div>
    </div>
  )
}

export default ScrollStack
