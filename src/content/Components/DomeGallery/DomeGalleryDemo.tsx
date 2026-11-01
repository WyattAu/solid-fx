import DomeGallery from './DomeGallery'
import type { DomeGalleryItem } from './DomeGallery'

const IMAGES: DomeGalleryItem[] = [
  'https://picsum.photos/seed/dome-1/774/500',
  'https://picsum.photos/seed/dome-2/774/500',
  'https://picsum.photos/seed/dome-3/774/500',
  'https://picsum.photos/seed/dome-4/774/500',
  'https://picsum.photos/seed/dome-5/774/500',
  'https://picsum.photos/seed/dome-6/774/500',
  'https://picsum.photos/seed/dome-7/774/500',
]

function DomeGalleryDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-[#120F17]">
      <DomeGallery images={IMAGES} grayscale />
    </div>
  )
}

export default DomeGalleryDemo
