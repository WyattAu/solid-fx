// solid-fx SEO widget demo — original component (not a port).
import { createSignal, For } from 'solid-js'
import CwVitals from './CwVitals'
import type { CwVitalsVariant } from './CwVitals'

const VARIANTS: CwVitalsVariant[] = ['rings', 'bars']

function CwVitalsDemo() {
  const [variant, setVariant] = createSignal<CwVitalsVariant>('rings')
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-5 overflow-auto bg-gray-950 p-6">
      <div class="flex flex-wrap justify-center gap-2">
        <For each={VARIANTS}>
          {v => (
            <button
              type="button"
              class={`rounded-lg px-3 py-1 text-xs ${
                variant() === v
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-zinc-400 hover:bg-white/15'
              }`}
              onClick={() => setVariant(v)}
            >
              {v}
            </button>
          )}
        </For>
      </div>
      <div class="w-full max-w-2xl">
        <CwVitals variant={variant()} lcp={1850} inp={240} cls={0.08} ttfb={620} fcp={1450} />
      </div>
    </div>
  )
}

export default CwVitalsDemo
