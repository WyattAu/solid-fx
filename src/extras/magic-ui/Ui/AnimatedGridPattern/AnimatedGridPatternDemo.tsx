// Source: github.com/magicuidesign/magicui apps/www/registry/example/animated-grid-pattern-demo.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream demo stage is theme-aware; pinned to the dark variant and given a
// title so the pattern reads on the docs' dark stage. Squares use
// `currentColor`, so the stage sets a gray text color.
import AnimatedGridPattern from './AnimatedGridPattern'

function AnimatedGridPatternDemo() {
  return (
    <div class="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-20 text-gray-500">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.4}
        duration={3}
        repeatDelay={1}
        class="inset-x-0! inset-y-[-30%]! h-[200%]! skew-y-12 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
      />
      <span class="pointer-events-none z-10 bg-linear-to-b from-white to-slate-900/10 bg-clip-text text-center text-8xl leading-none font-semibold whitespace-pre-wrap text-transparent">
        Animated Grid
      </span>
    </div>
  )
}

export default AnimatedGridPatternDemo
