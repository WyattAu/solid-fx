// Source: github.com/magicuidesign/magicui apps/www/registry/example/animated-gradient-text-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import AnimatedGradientText from './AnimatedGradientText'

function AnimatedGradientTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="group rounded-full bg-gray-950 p-px">
        <AnimatedGradientText class="rounded-full px-4 py-1 text-sm font-medium">
          <span class="text-lg">✨</span>
          Introducing Magic UI
        </AnimatedGradientText>
      </div>
    </div>
  )
}

export default AnimatedGradientTextDemo
