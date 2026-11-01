import { createSignal, onCleanup, onMount } from 'solid-js'
import PixelTransition from './PixelTransition'

function PixelTransitionDemo() {
  const [active, setActive] = createSignal(false)

  onMount(() => {
    const id = setInterval(() => setActive(value => !value), 2400)
    onCleanup(() => clearInterval(id))
  })

  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950">
      <PixelTransition
        active={active()}
        gridSize={14}
        pixelColor="#a78bfa"
        animationStepDuration={0.45}
        pattern="ripple"
        pixelShape="rounded"
        aspectRatio="16 / 10"
        class="w-full max-w-md"
        firstContent={
          <div class="flex h-full w-full items-center justify-center bg-neutral-900">
            <span class="text-xs font-medium tracking-[0.3em] text-neutral-300 uppercase">
              Pixel transition
            </span>
          </div>
        }
        secondContent={
          <img
            src="https://picsum.photos/seed/pixeltransition/640/400"
            alt=""
            class="h-full w-full object-cover"
            draggable={false}
          />
        }
      />
    </div>
  )
}

export default PixelTransitionDemo
