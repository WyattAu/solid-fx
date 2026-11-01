import FlexCarousel from './FlexCarousel'
import type { FlexCarouselItem } from './FlexCarousel'

const ITEMS: FlexCarouselItem[] = [
  {
    src: 'https://picsum.photos/seed/flex-1/900/700',
    title: 'Iridescence',
    subtitle: 'Chrome study',
  },
  { src: 'https://picsum.photos/seed/flex-2/900/700', title: 'White Room', subtitle: 'Studio' },
  { src: 'https://picsum.photos/seed/flex-3/900/700', title: 'Liquid Metal', subtitle: 'Form' },
  { src: 'https://picsum.photos/seed/flex-4/900/700', title: 'Clay Study', subtitle: 'Profile' },
  { src: 'https://picsum.photos/seed/flex-5/900/700', title: 'Low Tops', subtitle: 'Product' },
  { src: 'https://picsum.photos/seed/flex-6/900/700', title: 'Brim', subtitle: 'Editorial' },
]

function FlexCarouselDemo() {
  return (
    <div class="h-96 w-full bg-gray-950">
      <FlexCarousel
        items={ITEMS}
        preset="liquid"
        intro="rise"
        cardHeight={0.5}
        gap={12}
        radius={16}
      />
    </div>
  )
}

export default FlexCarouselDemo
