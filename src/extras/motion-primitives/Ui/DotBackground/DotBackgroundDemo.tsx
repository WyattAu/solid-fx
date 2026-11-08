// Source: github.com/magicuidesign/magicui apps/www/registry/example/dot-pattern-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import DotBackground from './DotBackground'

function DotBackgroundDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <DotBackground class="[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]" />
      <p class="z-10 text-center font-mono text-sm uppercase tracking-widest text-zinc-100">
        Dot Background
      </p>
    </div>
  )
}

export default DotBackgroundDemo
