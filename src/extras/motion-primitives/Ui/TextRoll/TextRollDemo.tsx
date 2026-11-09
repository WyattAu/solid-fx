// Source: github.com/ibelick/motion-primitives app/docs/text-roll/text-roll-demo.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import TextRoll from './TextRoll'

function TextRollDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <TextRoll
        class="font-mono text-3xl font-medium text-zinc-100"
        duration={0.5}
      >
        Motion Primitives
      </TextRoll>
    </div>
  )
}

export default TextRollDemo
