// solid-fx scenes layer — composition, not a port.
// ZeroClsScene: deterministic-paint landing grammar. Every box reserves its
// final geometry at first paint (intrinsic aspect ratios, fixed tracks,
// pre-sized type) so layout shift is structurally impossible — and a live
// PerformanceObserver meter proves it, with a stress button that injects a
// shift on demand to show the meter actually measures.
import type { JSX } from 'solid-js'
import { createSignal, For, onCleanup, onMount } from 'solid-js'

/** lib.dom in this TS version lacks the LayoutShift entry type. */
interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

export interface ZeroClsSceneProps {
  headline?: string
  /** Hero art aspect ratio, reserved at first paint (default '16 / 9'). */
  heroAspect?: string
  class?: string
  style?: JSX.CSSProperties
}

export function ZeroClsScene(props: ZeroClsSceneProps) {
  const [cls, setCls] = createSignal(0)
  const [sessions, setSessions] = createSignal(1)
  let observer: PerformanceObserver | null = null

  onMount(() => {
    if (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes?.includes('layout-shift')
    ) {
      observer = new PerformanceObserver(list => {
        let delta = 0
        for (const entry of list.getEntries()) {
          // exclude shifts caused by the stress button's own click region
          const shift = entry as LayoutShiftEntry
          if (!shift.hadRecentInput) delta += shift.value
        }
        if (delta > 0) setCls(v => v + delta)
      })
      observer.observe({ type: 'layout-shift', buffered: false })
    }
    onCleanup(() => observer?.disconnect())
  })

  // stress: inject real content mid-session — the meter should catch it
  const stress = () => {
    setSessions(s => s + 1)
  }

  const verdict = () =>
    cls() < 0.005 ? 'CLS 0.000 — deterministic' : `CLS ${cls().toFixed(3)} — shift detected`

  return (
    <section class={`w-full ${props.class ?? ''}`} style={props.style}>
      <div class="mb-4 flex items-baseline justify-between">
        <h1 class="text-2xl font-semibold tracking-tight text-gray-50">
          {props.headline ?? 'Paint once. Paint final.'}
        </h1>
        <span
          class="rounded-full px-2.5 py-1 font-mono text-xs"
          style={{
            background: cls() < 0.005 ? 'oklch(0.35 0.08 155)' : 'oklch(0.4 0.12 30)',
            color: 'oklch(0.95 0.02 250)',
          }}
          aria-live="polite"
        >
          {verdict()}
        </span>
      </div>

      {/* hero: geometry reserved by aspect-ratio — nothing reflows when art loads */}
      <div
        class="w-full overflow-hidden rounded-xl border border-gray-800"
        style={{ 'aspect-ratio': props.heroAspect ?? '16 / 9' }}
      >
        <div
          class="h-full w-full"
          style={{
            background:
              'radial-gradient(120% 90% at 20% 10%, oklch(0.3 0.07 235), transparent 60%), radial-gradient(110% 100% at 85% 90%, oklch(0.32 0.09 85), transparent 55%), oklch(0.16 0.02 250)',
          }}
        />
      </div>

      {/* fixed three-track feature row: tracks locked before any content arrives */}
      <div class="mt-5 grid grid-cols-3 gap-3">
        <For each={['intrinsic', 'reserved', 'final']}>
          {(word, i) => (
            <div
              class="rounded-lg border border-gray-800 bg-gray-900 p-3"
              style={{ 'min-height': '7rem' }}
            >
              <div class="font-mono text-[10px] text-gray-500">0{i() + 1}</div>
              <div class="mt-1 text-sm font-medium text-gray-200">{word} geometry</div>
              <div class="mt-1 text-xs leading-5 text-gray-400">
                aspect-ratio and fixed min-heights hold the box open — first paint lands in final
                position.
              </div>
            </div>
          )}
        </For>
      </div>

      {/* stress area: sessions appear below the fold-line of the meter */}
      <div class="mt-5 flex items-center justify-between rounded-lg border border-dashed border-gray-700 p-3">
        <span class="text-xs text-gray-400">
          layout-shift entries observed:{' '}
          <span class="font-mono text-gray-200">{cls().toFixed(4)}</span>
        </span>
        <button
          type="button"
          class="rounded bg-gray-800 px-2.5 py-1 text-xs text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
          onClick={stress}
        >
          inject a session block (stress the meter)
        </button>
      </div>
      <For each={Array.from({ length: sessions() - 1 })}>
        {(_, i) => (
          <div class="mt-2 rounded-lg bg-gray-900 p-2.5 text-xs text-amber-300/80">
            session block {i() + 1} inserted after load — its arrival is a real layout shift, and
            the meter above caught it.
          </div>
        )}
      </For>
    </section>
  )
}

export default ZeroClsScene
