// Source: demo harness derived from github.com/codse/animata animata/text/typing-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import TypingText from './TypingText'

function TypingTextDemo() {
  return (
    <div class="flex h-64 w-full flex-col items-center justify-center gap-6 rounded-lg border border-gray-800 bg-gray-950">
      <TypingText text="typing, erasing, retyping — on repeat" class="text-lg text-neutral-100" />
      <TypingText
        text="smooth mode reveals word by word"
        smooth
        delay={200}
        class="text-lg text-pink-400"
      />
    </div>
  )
}

export default TypingTextDemo
