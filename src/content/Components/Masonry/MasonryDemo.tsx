import Masonry from './Masonry'
import type { MasonryItem } from './Masonry'

const ITEMS: MasonryItem[] = [1, 2, 3, 4, 5, 6].map(n => ({
  id: n,
  img: `https://picsum.photos/seed/masonry-${n}/640/${n % 2 === 0 ? 800 : 480}`,
  width: 640,
  height: n % 2 === 0 ? 800 : 480,
  title: `Card ${n}`,
  description: 'Solid masonry tile',
}))

function MasonryDemo() {
  return (
    <div class="h-96 w-full overflow-y-auto bg-gray-950 p-4">
      <Masonry items={ITEMS} columns={3} gap={12} animateFrom="bottom" stagger={0.05} />
    </div>
  )
}

export default MasonryDemo
