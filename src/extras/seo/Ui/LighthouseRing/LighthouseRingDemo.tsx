// solid-fx SEO widget demo — original component (not a port).
import { createSignal, For } from 'solid-js'
import LighthouseRing from './LighthouseRing'
import type { LighthouseRingVariant } from './LighthouseRing'

const VARIANTS: LighthouseRingVariant[] = ['rings', 'bars']

function LighthouseRingDemo() {
  const [variant, setVariant] = createSignal<LighthouseRingVariant>('rings')
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
      <div class="w-full max-w-xl">
        <LighthouseRing
          variant={variant()}
          size={150}
          scores={{ performance: 96, accessibility: 100, bestPractices: 92, seo: 98 }}
        />
      </div>
    </div>
  )
}

export default LighthouseRingDemo
