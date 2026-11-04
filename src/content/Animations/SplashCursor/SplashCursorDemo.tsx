import { onMount } from 'solid-js'
import SplashCursor from './SplashCursor'
import { autoPointer } from '@/lib/syntheticPointer'

function SplashCursorDemo() {
  let host!: HTMLDivElement
  // PORTING.md §6: look alive without interaction — the mount intro fades
  // after ~2.5s, so synthesize pointer moves to keep ink flowing (the sim
  // listens on window; contained mode clamps to this rect).
  onMount(() => autoPointer(host, { hz: 30 }))
  return (
    <div ref={host} class="relative h-96 w-full overflow-hidden rounded-xl bg-neutral-950">
      <SplashCursor contained quality="low" colors={['#7c5cff', '#2dd4bf', '#ffd166']} />
      <div class="pointer-events-none relative z-10 flex h-full items-center justify-center">
        <span class="text-xs font-medium tracking-[0.3em] text-white/60 uppercase">
          Move through the ink
        </span>
      </div>
    </div>
  )
}

export default SplashCursorDemo
