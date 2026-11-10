// Source: github.com/ibelick/motion-primitives app/docs/text-shimmer/text-shimmer-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import TextShimmer from './TextShimmer'

function TextShimmerDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-6">
      <TextShimmer class="font-mono text-lg" duration={2}>
        Shimmering text with motion
      </TextShimmer>
    </div>
  )
}

export default TextShimmerDemo
