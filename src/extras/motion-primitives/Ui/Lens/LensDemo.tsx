// Demo harness for the Lens port. Dark-stage friendly, self-contained
// (picsum placeholder image, no network calls at build time).
// Hover the image: a circular lens magnifies the content under the pointer.
import Lens from './Lens'

function LensDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-3 rounded-lg border border-gray-800 bg-gray-950 p-6">
      <Lens zoomFactor={2} lensSize={160} duration={0.15} class="max-w-md">
        <img
          src="https://picsum.photos/seed/lens-zoom/800/500"
          alt="Lens zoom demo"
          class="h-64 w-full rounded-xl object-cover"
          loading="lazy"
        />
      </Lens>
      <p class="text-sm text-neutral-400">Hover to magnify · press Escape to dismiss</p>
    </div>
  )
}

export default LensDemo
