// Demo harness for the AnimatedGroup port. Dark-stage friendly, self-contained.

import { For } from 'solid-js'
import AnimatedGroup from './AnimatedGroup'

const FEATURES = [
  { name: 'Springs', desc: 'Duration-based or physical spring easing.' },
  { name: 'Stagger', desc: 'Children reveal in a 0.1s sequence.' },
  { name: 'Presets', desc: 'Ten presets: fade, slide, zoom, flip...' },
  { name: 'Variants', desc: 'Bring your own container/item variants.' },
]

function AnimatedGroupDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <AnimatedGroup preset="bounce" class="grid w-full max-w-xl grid-cols-2 gap-4">
        <For each={FEATURES}>
          {feature => (
            <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p class="text-sm font-medium text-white">{feature.name}</p>
              <p class="mt-1 text-xs text-neutral-400">{feature.desc}</p>
            </div>
          )}
        </For>
      </AnimatedGroup>
    </div>
  )
}

export default AnimatedGroupDemo
