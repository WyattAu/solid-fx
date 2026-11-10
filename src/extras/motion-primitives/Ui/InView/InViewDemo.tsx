// Source: github.com/ibelick/motion-primitives app/docs/in-view/in-view-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import { For } from 'solid-js'
import InView from './InView'

function InViewDemo() {
  return (
    <div class="h-96 w-full overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-8">
      <p class="pb-64 font-mono text-sm text-zinc-500">Scroll down to reveal the cards.</p>
      <For each={['Card one', 'Card two', 'Card three']}>
        {label => (
          <InView
            class="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-6 text-gray-100"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            once
          >
            <p class="font-mono text-sm">{label}</p>
          </InView>
        )}
      </For>
    </div>
  )
}

export default InViewDemo
