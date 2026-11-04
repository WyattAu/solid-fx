import { onMount } from 'solid-js'
import Ribbons from './Ribbons'
import { autoPointer } from '@/lib/syntheticPointer'

function RibbonsDemo() {
  let host!: HTMLDivElement
  // PORTING.md §6: look alive without interaction — the ribbon anchors only
  // leave the center once pointermove reports movement, so synthesize it.
  onMount(() => autoPointer(host, { hz: 30 }))
  return (
    <div ref={host} class="relative h-96 w-full overflow-hidden bg-neutral-950">
      <Ribbons
        colors={['#3847ff', '#7c84ff', '#c7cbff']}
        thickness={26}
        stiffness={0.6}
        bounce={0.55}
        wave={0.4}
        softness={0.45}
        fade
      />
    </div>
  )
}

export default RibbonsDemo
