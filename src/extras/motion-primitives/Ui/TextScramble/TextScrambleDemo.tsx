// Source: github.com/ibelick/motion-primitives app/docs/text-scramble/text-scramble-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import TextScramble from './TextScramble'

function TextScrambleDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 rounded-lg border border-gray-800 bg-gray-950 p-6">
      <TextScramble class="font-mono text-sm uppercase text-zinc-100">Text Scramble</TextScramble>
      <TextScramble class="font-mono text-sm text-zinc-400" characterSet="0123456789" speed={0.06}>
        decoding payload...
      </TextScramble>
    </div>
  )
}

export default TextScrambleDemo
