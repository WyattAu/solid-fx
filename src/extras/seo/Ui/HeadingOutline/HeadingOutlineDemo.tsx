// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import HeadingOutline from './HeadingOutline'

function HeadingOutlineDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 75% 15%, rgba(16,185,129,0.12), transparent 55%), radial-gradient(circle at 25% 85%, rgba(59,130,246,0.1), transparent 50%)',
        }}
      />
      <HeadingOutline class="h-full" />
    </div>
  )
}

export default HeadingOutlineDemo
