import { onMount } from 'solid-js'
import ImageTrail from './ImageTrail'
import { autoPointer } from '@/lib/syntheticPointer'

const IMAGES = Array.from(
  { length: 10 },
  (_, i) => `https://picsum.photos/seed/imagetrail-${i + 1}/320/290`,
)

function ImageTrailDemo() {
  let host!: HTMLDivElement
  // PORTING.md §6: look alive without interaction — synthesize the pointer
  // sweep the engine tracks (mousemove on the ImageTrail container itself,
  // so dispatch on that child, not this host: events only bubble upward).
  onMount(() => {
    const trail = host.firstElementChild
    if (trail) autoPointer(trail as HTMLElement, { mouse: true, hz: 30 })
  })
  return (
    <div ref={host} class="flex h-96 w-full items-center justify-center overflow-hidden bg-neutral-950">
      <ImageTrail
        items={IMAGES}
        size={190}
        aspectRatio={1.1}
        radius={16}
        tilt={8}
        drift={0.6}
        flash={0.3}
      />
    </div>
  )
}

export default ImageTrailDemo
