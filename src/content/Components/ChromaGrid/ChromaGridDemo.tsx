import ChromaGrid from './ChromaGrid'
import type { ChromaItem } from './ChromaGrid'

const items: ChromaItem[] = Array.from({ length: 6 }, (_, i) => ({
  image: `https://picsum.photos/seed/chroma${i + 1}/800/540`,
  title: ['Golden Hour', 'Steel Arches', 'Black Beach', 'Cloud Front', 'Pink Drift', 'Cumulus'][i],
  subtitle: ['Sky study', 'Sculpture', 'Landscape', 'Weather', 'Sky study', 'Weather'][i],
  accent: ['#ff8a4c', '#ff5a36', '#a98bff', '#ffb27a', '#ff7eb6', '#7cc4ff'][i],
}))

function ChromaGridDemo() {
  return (
    <div class="h-96 w-full bg-gray-950 p-4">
      <ChromaGrid items={items} columns={3} grayscale={1} glow={0.6} />
    </div>
  )
}

export default ChromaGridDemo
