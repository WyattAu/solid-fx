// Built with Lenis (github.com/darkroomengineering/lenis) — MIT. Smooth scroll engine pilot per EXTRAS-ROADMAP.md.
import { For, Show, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import Lenis from 'lenis'
import { useReducedMotion } from '@/lib/reducedMotion'

export interface StackingCard {
  title: string
  description?: string
}

interface StackingCardsProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** React parity alias; merges with `class`. */
  className?: string
  /** Card deck, stacked first-to-last as you scroll. */
  cards: StackingCard[]
  /**
   * Existing Lenis instance to subscribe to (e.g. a parent SmoothScroll owns
   * the window scroll). When omitted — and motion is not reduced — a
   * window-scoped Lenis is created here ({ autoRaf: true }); do not
   * double-wrap in SmoothScroll in that case.
   */
  lenis?: Lenis
  /**
   * Per-card shrink step applied each time a later card stacks over it.
   * Cumulative, floored at 0.6.
   * @default 0.05
   */
  shrink?: number
}

export function StackingCards(props: StackingCardsProps) {
  const [own, rest] = splitProps(props, [
    'class',
    'className',
    'style',
    'cards',
    'lenis',
    'shrink',
  ])

  const reduced = useReducedMotion()
  const cards = () => own.cards ?? []
  // Height = one viewport of scroll per card; caller style may be an object
  // or a string, so merge both shapes.
  const rootStyle = () =>
    typeof own.style === 'string'
      ? `height: ${cards().length * 100}vh; ${own.style}`
      : { height: `${cards().length * 100}vh`, ...own.style }

  let section!: HTMLDivElement
  let cardEls: HTMLDivElement[] = []

  // PORT-NOTE: per-card scale is written straight to the DOM in the Lenis
  // scroll callback (no signals per frame) — same direct-write pattern as the
  // vanilla `motion` ports. Geometry is recomputed from live rects each tick,
  // so no resize handling is needed.
  onMount(() => {
    const n = cards().length
    if (!n || reduced()) return // CSS sticky stack alone carries reduced motion

    let instance = own.lenis
    const owns = !instance
    if (!instance) instance = new Lenis({ autoRaf: true })
    const lenis = instance

    const update = () => {
      const vh = window.innerHeight
      const span = section.offsetHeight - vh
      if (span <= 0) return
      // Segment units: how many card-arrivals have completed (0 → n-1).
      const rect = section.getBoundingClientRect()
      const s = Math.min(Math.max((-rect.top / span) * (n - 1), 0), n - 1)
      const shrink = own.shrink ?? 0.05
      for (let i = 0; i < n; i++) {
        const el = cardEls[i]
        if (!el) continue
        // Cards after i have stacked over card i `covered` times so far.
        const covered = Math.min(Math.max(s - i, 0), n - 1 - i)
        el.style.transform = `scale(${Math.max(0.6, 1 - covered * shrink)})`
      }
    }

    const unsubscribe = lenis.on('scroll', update)
    update()
    onCleanup(() => {
      unsubscribe()
      cardEls = []
      if (owns) lenis.destroy()
    })
  })

  return (
    <div
      {...rest}
      ref={section}
      class={`relative ${own.class ?? ''} ${own.className ?? ''}`}
      style={rootStyle()}
    >
      <For each={cards()}>
        {(card, i) => (
          // Each card owns one viewport of scroll and pins to the top; later
          // cards slide over it via CSS sticky while the covered card scales
          // down in the scroll callback.
          <div
            class="flex h-screen items-center justify-center p-4 sm:p-8"
            style={{ position: 'sticky', top: `${i() * 10}px` }}
          >
            <div
              ref={el => (cardEls[i()] = el)}
              class="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-8 text-white shadow-2xl will-change-transform"
              style={{ 'transform-origin': '50% 0%' }}
            >
              <h3 class="text-2xl font-semibold">{card.title}</h3>
              <Show when={card.description}>
                <p class="mt-3 text-white/70">{card.description}</p>
              </Show>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

export default StackingCards
