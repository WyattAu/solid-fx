// Source: github.com/ibelick/motion-primitives app/docs/text-effect/text-effect-preset.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import TextEffect from './TextEffect'

function TextEffectDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 rounded-lg border border-gray-800 bg-gray-950 p-6">
      <TextEffect per="word" as="h3" preset="slide" class="text-2xl font-semibold text-zinc-100">
        Animate your ideas with motion-primitives
      </TextEffect>
      <TextEffect per="char" preset="blur" delay={0.4} class="font-mono text-sm text-zinc-400">
        staggered blur, character by character
      </TextEffect>
    </div>
  )
}

export default TextEffectDemo
