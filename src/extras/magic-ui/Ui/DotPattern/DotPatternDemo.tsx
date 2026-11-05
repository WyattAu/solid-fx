// Source: github.com/magicuidesign/magic-ui apps/www/registry/example/dot-pattern-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import DotPattern from './DotPattern'

function DotPatternDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <span class="pointer-events-none relative z-10 text-sm text-neutral-300">
        Glowing dot pattern
      </span>
      <DotPattern
        glow
        class="[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
      />
    </div>
  )
}

export default DotPatternDemo
