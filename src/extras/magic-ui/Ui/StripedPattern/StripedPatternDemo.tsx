// Source: github.com/magicuidesign/magicui apps/www/registry/example/striped-pattern-demo.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
// Upstream demo renders on the page background; pinned to the docs' dark
// stage with a caption so the `currentColor` strokes read against it.
import StripedPattern from './StripedPattern'

function StripedPatternDemo() {
  return (
    <div class="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <span class="pointer-events-none relative z-20 text-sm text-neutral-300">
        Striped pattern
      </span>
      <StripedPattern class="text-neutral-400 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]" />
    </div>
  )
}

export default StripedPatternDemo
