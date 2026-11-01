import { createSignal } from 'solid-js'
import JellyRadio from './JellyRadio'

function JellyRadioDemo() {
  const [value, setValue] = createSignal('Medium')
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-zinc-950 p-8 text-white">
      <JellyRadio value={value()} onChange={setValue} ariaLabel="Fan speed" />
      <p class="text-sm text-zinc-400">Speed: {value()}</p>
    </div>
  )
}

export default JellyRadioDemo
