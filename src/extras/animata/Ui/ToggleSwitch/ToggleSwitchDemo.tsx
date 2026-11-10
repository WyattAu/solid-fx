// Source: demo harness derived from github.com/codse/animata animata/button/toggle-switch.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import { createSignal } from 'solid-js'
import ToggleSwitch from './ToggleSwitch'

function ToggleSwitchDemo() {
  const [on, setOn] = createSignal(false)
  return (
    <div class="flex h-64 w-full flex-col items-center justify-center gap-6 rounded-lg border border-gray-800 bg-gray-950">
      <ToggleSwitch onChange={setOn} defaultChecked />
      <span class="text-xs text-neutral-500">{on() ? 'on' : 'off'}</span>
      <span class="text-xs text-neutral-500">Click the switch to toggle</span>
    </div>
  )
}

export default ToggleSwitchDemo
