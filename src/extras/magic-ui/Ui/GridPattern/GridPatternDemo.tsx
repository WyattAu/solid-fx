// Source: github.com/magicuidesign/magic-ui apps/www/registry/example/grid-pattern-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import GridPattern from './GridPattern'

function GridPatternDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <span class="pointer-events-none relative z-10 text-sm text-neutral-300">
        Skewed grid pattern with highlighted cells
      </span>
      <GridPattern
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
          [10, 10],
          [12, 15],
          [15, 10],
          [10, 15],
          [15, 10],
          [10, 15],
          [15, 10],
        ]}
        class="[mask-image:radial-gradient(400px_circle_at_center,white,transparent)] inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
      />
    </div>
  )
}

export default GridPatternDemo
