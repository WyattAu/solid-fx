// Source: github.com/ibelick/motion-primitives app/docs/transition-panel/transition-panel-tabs.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import { createSignal, For } from 'solid-js'
import TransitionPanel from './TransitionPanel'

const ITEMS = [
  {
    title: 'Aesthetics',
    subtitle: 'Refining Visual Harmony',
    content:
      'Explore the principles of motion aesthetics that enhance the visual appeal of interfaces. Learn to balance timing, easing, and the flow of motion to create seamless user experiences.',
  },
  {
    title: 'Art',
    subtitle: 'Narrative and Expression',
    content:
      'Delve into how motion can be used as an artistic tool to tell stories and evoke emotions, making digital interactions feel more human and expressive.',
  },
  {
    title: 'Technique',
    subtitle: 'Mastering Motion Tools',
    content:
      'Gain proficiency in advanced techniques such as physics-based animations, 3D transformations, and complex sequencing to elevate your design skills and implementation.',
  },
]

function TransitionPanelDemo() {
  const [activeIndex, setActiveIndex] = createSignal(0)

  return (
    <div class="flex h-96 w-full flex-col justify-center rounded-lg border border-gray-800 bg-gray-950 p-6">
      <div class="mb-4 flex space-x-2">
        <For each={ITEMS}>
          {(item, index) => (
            <button
              type="button"
              onClick={() => setActiveIndex(index())}
              class={`rounded-md px-3 py-1 text-sm font-medium ${
                activeIndex() === index()
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              {item.title}
            </button>
          )}
        </For>
      </div>
      <div class="overflow-hidden border-t border-zinc-800">
        <TransitionPanel
          activeIndex={activeIndex()}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          variants={{
            enter: { opacity: 0, y: -50, filter: 'blur(4px)' },
            center: { opacity: 1, y: 0, filter: 'blur(0px)' },
            exit: { opacity: 0, y: 50, filter: 'blur(4px)' },
          }}
        >
          <For each={ITEMS}>
            {item => (
              <div class="py-2">
                <h3 class="mb-2 font-medium text-zinc-100">{item.subtitle}</h3>
                <p class="text-zinc-400">{item.content}</p>
              </div>
            )}
          </For>
        </TransitionPanel>
      </div>
    </div>
  )
}

export default TransitionPanelDemo
