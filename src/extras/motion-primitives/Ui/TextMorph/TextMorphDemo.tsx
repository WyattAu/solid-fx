// Source: github.com/ibelick/motion-primitives app/docs/text-morph/text-morph-button.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import { createSignal, For } from 'solid-js'
import TextMorph from './TextMorph'

function TextMorphDemo() {
  const [text, setText] = createSignal('Continue')

  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 rounded-lg border border-gray-800 bg-gray-950 p-6">
      <button
        type="button"
        onClick={() => setText(text() === 'Continue' ? 'Confirm' : 'Continue')}
        class="flex h-10 w-[120px] shrink-0 items-center justify-center rounded-full bg-zinc-50 px-4 text-base font-medium text-black shadow-xs transition-colors hover:bg-zinc-200"
      >
        <TextMorph>{text()}</TextMorph>
      </button>
      <div class="text-center text-sm text-zinc-500">
        <p>Spring-morphed label — persisted characters slide, new ones fade in.</p>
        <For each={['Deploy', 'Ship', 'Release']}>
          {word => (
            <button
              type="button"
              onClick={() => setText(word)}
              class="mx-1 mt-2 rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              {word}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

export default TextMorphDemo
