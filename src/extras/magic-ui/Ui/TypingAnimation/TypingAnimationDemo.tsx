// Source: github.com/magicuidesign/magicui apps/www/registry/example/typing-animation-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream demo types a single string; the demo cycles words with `loop` so
// the typing machine stays alive on the dark stage without interaction.
import TypingAnimation from './TypingAnimation'

function TypingAnimationDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <TypingAnimation
        class="text-4xl font-bold text-white"
        words={['Magic UI', 'SolidJS', 'Typed text']}
        loop
      />
    </div>
  )
}

export default TypingAnimationDemo
