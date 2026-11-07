// Source: github.com/ibelick/motion-primitives app/docs/text-shimmer-wave/text-shimmer-wave-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import TextShimmerWave from './TextShimmerWave'

function TextShimmerWaveDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-6">
      <TextShimmerWave
        class="font-mono text-sm"
        style={{
          '--base-color': '#71717a',
          '--base-gradient-color': '#ffffff',
        }}
        duration={1}
      >
        Generating code...
      </TextShimmerWave>
    </div>
  )
}

export default TextShimmerWaveDemo
