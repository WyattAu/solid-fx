import { createSignal } from 'solid-js';
import CircularCarousel from './CircularCarousel';
import type { CircularCarouselItem } from './CircularCarousel';

const ITEMS: CircularCarouselItem[] = [
  { src: 'https://picsum.photos/seed/ring-1/700/700', title: 'Valley', subtitle: 'Landscape' },
  { src: 'https://picsum.photos/seed/ring-2/700/700', title: 'Portrait', subtitle: 'Studio' },
  { src: 'https://picsum.photos/seed/ring-3/700/700', title: 'Towers', subtitle: 'Architecture' },
  { src: 'https://picsum.photos/seed/ring-4/700/700', title: 'Swell', subtitle: 'Ocean' },
  { src: 'https://picsum.photos/seed/ring-5/700/700', title: 'Facade', subtitle: 'Architecture' },
  { src: 'https://picsum.photos/seed/ring-6/700/700', title: 'Night', subtitle: 'Sky' },
  { src: 'https://picsum.photos/seed/ring-7/700/700', title: 'Mirror', subtitle: 'Landscape' },
  { src: 'https://picsum.photos/seed/ring-8/700/700', title: 'Street', subtitle: 'Editorial' }
];

function CircularCarouselDemo() {
  const [active, setActive] = createSignal(0);
  return (
    <div class="h-96 w-full bg-gray-950">
      <CircularCarousel items={ITEMS} preset="cylinder" captions onChange={setActive} />
      <p class="text-center text-xs text-white/40">front: {active() + 1} / {ITEMS.length} — drag or scroll</p>
    </div>
  );
}

export default CircularCarouselDemo;
