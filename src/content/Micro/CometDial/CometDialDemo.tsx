import { createSignal } from 'solid-js'
import CometDial from './CometDial'

function CometDialDemo() {
  const [value, setValue] = createSignal(62)
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 bg-zinc-950 p-8 text-white">
      <CometDial value={value()} onChange={setValue} label="Demo level" />
      <span class="text-sm text-zinc-400">Value: {value()}</span>
    </div>
  )
}

export default CometDialDemo
