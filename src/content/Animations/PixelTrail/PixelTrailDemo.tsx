import { onMount } from 'solid-js'
import PixelTrail from './PixelTrail'
import { autoPointer } from '@/lib/syntheticPointer'

function PixelTrailDemo() {
  let host!: HTMLDivElement
  // PORTING.md §6: look alive without interaction — synthesize the pointer
  // moves the engine waits for (it listens on window for pointermove).
  onMount(() => autoPointer(host, { hz: 30 }))
  return (
    <div ref={host} class="h-96 w-full overflow-hidden rounded-2xl border border-white/10">
      <PixelTrail class="h-full w-full" gridSize={48} trailSize={0.4} maxAge={500} />
    </div>
  )
}

export default PixelTrailDemo
