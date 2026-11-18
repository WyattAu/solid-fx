// solid-fx FX widget — original component (not a port).
import { For } from 'solid-js'
import ConfettiBurst from './ConfettiBurst'

function ConfettiBurstDemo() {
  const presets = [
    {
      label: 'ship it',
      particleCount: 120,
      spread: 100,
      colors: ['#34d399', '#38bdf8', '#fbbf24'],
    },
    {
      label: 'cannon (left)',
      particleCount: 90,
      spread: 60,
      colors: ['#fb7185', '#f472b6', '#a78bfa'],
    },
    { label: 'rain (sparse)', particleCount: 40, spread: 160, colors: ['#e5e7eb', '#94a3b8'] },
  ]
  return (
    <div class="flex w-full flex-wrap items-center justify-center gap-4 p-6">
      <For each={presets}>{p => <ConfettiBurst {...p} />}</For>
    </div>
  )
}

export default ConfettiBurstDemo
