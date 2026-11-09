// Source: github.com/ibelick/motion-primitives app/docs/sliding-number/sliding-number-demo-1.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import { createSignal, onCleanup, onMount } from 'solid-js'
import { animate } from 'motion'
import type { AnimationPlaybackControls } from 'motion'
import SlidingNumber from './SlidingNumber'

function SlidingNumberDemo() {
  const [value, setValue] = createSignal(0)
  let controls: AnimationPlaybackControls | undefined

  onMount(() => {
    controls = animate(0, 100, {
      duration: 4,
      ease: 'linear',
      repeat: Infinity,
      repeatDelay: 1,
      onUpdate: v => setValue(Math.round(v)),
    })
    onCleanup(() => controls?.stop())
  })

  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="flex items-center gap-4 font-mono text-4xl text-zinc-100">
        <span class="text-sm uppercase tracking-widest text-zinc-500">Progress</span>
        <SlidingNumber value={value()} padStart />
        <span class="text-xl text-zinc-500">%</span>
      </div>
    </div>
  )
}

export default SlidingNumberDemo
