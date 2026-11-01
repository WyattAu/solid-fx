import { createSignal } from 'solid-js';
import InfiniteMenu from './InfiniteMenu';

function InfiniteMenuDemo() {
  const [active, setActive] = createSignal(0);

  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950 p-6">
      <InfiniteMenu
        items={[1, 2, 3, 4, 5].map(n => ({
          image: `https://picsum.photos/seed/infinite-menu-${n}/400/400`,
          title: ['Aurora', 'Basalt', 'Canopy', 'Delta', 'Ember'][n - 1],
          description: 'Drag to spin the sphere of tiles.'
        }))}
        count={80}
        onActiveChange={(_item, index) => setActive(index)}
      />
      <span class="sr-only">{`Active: ${active()}`}</span>
    </div>
  );
}

export default InfiniteMenuDemo;
