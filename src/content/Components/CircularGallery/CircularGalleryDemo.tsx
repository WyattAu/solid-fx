import CircularGallery from './CircularGallery';
import type { GalleryItem } from './CircularGallery';

const ITEMS: GalleryItem[] = [
  { image: 'https://picsum.photos/seed/circ-1/800/600', text: 'Bridge' },
  { image: 'https://picsum.photos/seed/circ-2/800/600', text: 'Desk Setup' },
  { image: 'https://picsum.photos/seed/circ-3/800/600', text: 'Waterfall' },
  { image: 'https://picsum.photos/seed/circ-4/800/600', text: 'Strawberries' },
  { image: 'https://picsum.photos/seed/circ-5/800/600', text: 'Deep Diving' },
  { image: 'https://picsum.photos/seed/circ-6/800/600', text: 'Santorini' }
];

function CircularGalleryDemo() {
  return (
    <div class="h-96 w-full bg-gray-950">
      <CircularGallery items={ITEMS} bend={3} textColor="#ffffff" borderRadius={0.05} />
    </div>
  );
}

export default CircularGalleryDemo;
