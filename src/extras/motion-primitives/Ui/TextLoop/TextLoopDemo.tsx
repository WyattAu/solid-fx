// Source: github.com/ibelick/motion-primitives app/docs/text-loop/text-loop-demo-2.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import TextLoop from './TextLoop'

function TextLoopDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <p class="whitespace-nowrap font-mono text-lg text-zinc-400">
        Build interfaces{' '}
        <TextLoop
          class="inline-block align-baseline font-medium"
          interval={2}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <span class="text-[#0090FF]">that feel alive.</span>
          <span class="text-emerald-400">in record time.</span>
          <span class="text-amber-400">without the fuss.</span>
        </TextLoop>
      </p>
    </div>
  )
}

export default TextLoopDemo
