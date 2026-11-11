// Demo harness for the Carousel port. Dark-stage friendly, self-contained.
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselNavigation,
} from './Carousel'
import { For } from 'solid-js'

const SLIDES = [
  { seed: 'carousel-aurora', caption: 'Aurora' },
  { seed: 'carousel-dunes', caption: 'Dunes' },
  { seed: 'carousel-fjord', caption: 'Fjord' },
  { seed: 'carousel-tundra', caption: 'Tundra' },
]

function CarouselDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <Carousel class="w-full max-w-md">
        <CarouselContent>
          <For each={SLIDES}>
            {slide => (
              <CarouselItem class="px-1">
                <figure class="mb-8">
                  <img
                    src={`https://picsum.photos/seed/${slide.seed}/640/400`}
                    alt={slide.caption}
                    class="h-52 w-full rounded-xl object-cover"
                    draggable={false}
                  />
                  <figcaption class="mt-2 text-center text-xs text-neutral-400">
                    {slide.caption}
                  </figcaption>
                </figure>
              </CarouselItem>
            )}
          </For>
        </CarouselContent>
        <CarouselNavigation alwaysShow />
        <CarouselIndicator />
      </Carousel>
    </div>
  )
}

export default CarouselDemo
