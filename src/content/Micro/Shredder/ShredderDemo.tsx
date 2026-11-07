import { createSignal, onCleanup, onMount, Show } from 'solid-js'
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
  // The stage legitimately drains between shred cycles (loop revives only
  // after the last card clears), so CI captures can land on an empty tray.
  // Remount the whole shredder on a ~6s cycle: every capture window then has
  // fresh cards mid-feed/mid-shred instead of a keyed-blank stage.
  const [cycle, setCycle] = createSignal(0)
  onMount(() => {
    const t = setInterval(() => setCycle(c => c + 1), 6000)
    onCleanup(() => clearInterval(t))
  })
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8 text-white">
      <Show when={cycle() + 1} keyed>
        {(_cycle: number) => (
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
        )}
      </Show>
    </div>
  )
}

export default ShredderDemo
