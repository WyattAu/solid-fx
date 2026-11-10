// Demo harness for the ImageComparison port. Dark-stage friendly,
// self-contained (picsum placeholder images, no network calls at build time).
// PORT-NOTE: the drag handle's ChevronsLeftRight icon mirrors upstream demo
// styling with an identical inline lucide SVG (24×24, stroke-based).
import ImageComparison, { ImageComparisonImage, ImageComparisonSlider } from './ImageComparison'

function ChevronsLeftRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4"
    >
      <path d="m20 17-5-5 5-5" />
      <path d="m4 17 5-5-5-5" />
    </svg>
  )
}

function ImageComparisonDemo() {
  return (
    <div class="h-96 w-full overflow-hidden rounded-lg border border-gray-800">
      <ImageComparison enableHover class="h-full w-full">
        <ImageComparisonImage
          src="https://picsum.photos/seed/compare-a/800/400"
          alt="Left"
          position="left"
        />
        <ImageComparisonImage
          src="https://picsum.photos/seed/compare-b/800/400"
          alt="Right"
          position="right"
        />
        <ImageComparisonSlider class="bg-white/80">
          <div class="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white backdrop-blur-sm">
            <ChevronsLeftRightIcon />
          </div>
        </ImageComparisonSlider>
      </ImageComparison>
    </div>
  )
}

export default ImageComparisonDemo
