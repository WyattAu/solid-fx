import { createSignal } from 'solid-js';
import CardSwap from './CardSwap';
import type { CardSwapHandle, CardSwapItem } from './CardSwap';
import { SunsetIcon } from '@hugeicons/core-free-icons';
import HugeiconsIcon from '@/lib/HugeiconsIcon';

const ITEMS: CardSwapItem[] = [
  { title: 'Golden hour', image: 'https://picsum.photos/seed/swap-a/900/700', icon: <HugeiconsIcon icon={SunsetIcon} size={14} strokeWidth={1.8} /> },
  { title: 'Black beach', image: 'https://picsum.photos/seed/swap-b/900/700' },
  { title: 'Steel arches', image: 'https://picsum.photos/seed/swap-c/900/700' },
  { title: 'Pink drift', image: 'https://picsum.photos/seed/swap-d/900/700' }
];

function CardSwapDemo() {
  let handle: CardSwapHandle | undefined;
  const [front, setFront] = createSignal(0);
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 bg-gray-950 text-white">
      <div class="h-64 w-full">
        <CardSwap items={ITEMS} ref={h => (handle = h)} onChange={setFront} />
      </div>
      <div class="flex items-center gap-3 text-sm">
        <button type="button" class="rounded bg-white/10 px-3 py-1" onClick={() => handle?.prev()}>
          Prev
        </button>
        <span class="text-white/60">front: {front()}</span>
        <button type="button" class="rounded bg-white/10 px-3 py-1" onClick={() => handle?.next()}>
          Next
        </button>
      </div>
    </div>
  );
}

export default CardSwapDemo;
