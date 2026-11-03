import Carousel from './Carousel'

function CarouselDemo() {
  const items = [
    {
      title: 'Slide one',
      description: 'Drag or use the arrows — every effect is a hand-port.',
      image: 'https://picsum.photos/seed/fx-slide-1/600/400',
      alt: 'Slide one',
    },
    {
      title: 'Slide two',
      description: 'Springs, tilt and peek behave exactly like upstream.',
      image: 'https://picsum.photos/seed/fx-slide-2/600/400',
      alt: 'Slide two',
    },
    {
      title: 'Slide three',
      description: 'Swap the effect prop: tilt, fade or cube.',
      image: 'https://picsum.photos/seed/fx-slide-3/600/400',
      alt: 'Slide three',
    },
  ]
  return (
    <div class="w-full p-4">
      <div class="h-72 w-full">
        <Carousel items={items} class="h-full w-full" />
      </div>
    </div>
  )
}

export default CarouselDemo
