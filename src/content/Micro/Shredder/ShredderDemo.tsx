
import Shredder from './Shredder'

interface Card {
  id: string
  title: string
  hue: string
}

const CARDS: Card[] = [
  { id: 'a', title: 'Quarterly report', hue: '#3b82f6' },
  { id: 'b', title: 'Old wireframes', hue: '#a855f7' },
  { id: 'c', title: 'Meeting notes', hue: '#22c55e' },
]

function ShredderDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8 text-white">
      <Shredder
        items={CARDS}
        autoAnimate
        loop
        height={320}
        width={300}
        renderItem={(item: Card) => (
          <div
            class="flex h-16 w-full cursor-grab items-center gap-3 rounded-xl px-4"
            style={{ background: item.hue }}
          >
            <span class="text-sm font-semibold text-black/80">{item.title}</span>
          </div>
        )}
      />
    </div>
  )
}

export default ShredderDemo
