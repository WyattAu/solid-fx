// Source: demo harness derived from github.com/codse/animata animata/text/animated-gradient-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import AnimatedGradientText from './AnimatedGradientText'

function AnimatedGradientTextDemo() {
  return (
    <div class="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <AnimatedGradientText class="text-6xl font-bold">Hello, world!</AnimatedGradientText>
    </div>
  )
}

export default AnimatedGradientTextDemo
