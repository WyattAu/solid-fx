import { createSignal } from 'solid-js'
import BellToggle from './BellToggle'

function BellToggleDemo() {
  const [pressed, setPressed] = createSignal(false)
  const [count, setCount] = createSignal(3)
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-zinc-950 p-8 text-white">
      <BellToggle pressed={pressed()} onChange={setPressed} count={count()} />
      <button
        type="button"
        class="cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
        onClick={() => setCount(c => c + 1)}
      >
        Simulate notification ({count()})
      </button>
    </div>
  )
}

export default BellToggleDemo
