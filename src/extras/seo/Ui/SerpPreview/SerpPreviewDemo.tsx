// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import SerpPreview from './SerpPreview'

function SerpPreviewDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 70% 10%, rgba(52,211,153,0.12), transparent 55%), radial-gradient(circle at 30% 90%, rgba(59,130,246,0.1), transparent 50%)',
        }}
      />
      <SerpPreview class="h-full" />
    </div>
  )
}

export default SerpPreviewDemo
