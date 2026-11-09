// Source: github.com/ibelick/motion-primitives app/docs/infinite-slider/infinite-slider-demo-1.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import { For } from 'solid-js'
import InfiniteSlider from './InfiniteSlider'

const ITEMS = [
  { label: 'Solid', emoji: '◆' },
  { label: 'Fast', emoji: '⚡' },
  { label: 'Typed', emoji: '✓' },
  { label: 'Tiny', emoji: '○' },
  { label: 'MIT', emoji: '♥' },
]

function InfiniteSliderDemo() {
  return (
    <div class="flex h-96 w-full items-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <InfiniteSlider gap={48} speed={60} speedOnHover={20}>
        <For each={ITEMS}>
          {item => (
            <span class="flex shrink-0 items-center gap-3 rounded-full border border-gray-700 bg-gray-900 px-6 py-3 font-mono text-lg text-zinc-100">
              <span class="text-[#0090FF]">{item.emoji}</span>
              {item.label}
            </span>
          )}
        </For>
      </InfiniteSlider>
    </div>
  )
}

export default InfiniteSliderDemo
