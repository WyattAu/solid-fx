import { createSignal } from 'solid-js'
import BounceCards from './BounceCards'

const IMAGES = [
  'https://picsum.photos/seed/bounce-a/400/400',
  'https://picsum.photos/seed/bounce-b/400/400',
  'https://picsum.photos/seed/bounce-c/400/400',
  'https://picsum.photos/seed/bounce-d/400/400',
  'https://picsum.photos/seed/bounce-e/400/400',
]

function BounceCardsDemo() {
  const [last, setLast] = createSignal('')
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 bg-gray-950">
      <BounceCards
        images={IMAGES}
        containerWidth={420}
        containerHeight={260}
        cardSize={140}
        arc={30}
        onCardClick={index => setLast(`Card ${index + 1} clicked`)}
      />
      <p class="text-sm text-white/50">{last() || 'Hover the cards, click to bounce'}</p>
    </div>
  )
}

export default BounceCardsDemo
