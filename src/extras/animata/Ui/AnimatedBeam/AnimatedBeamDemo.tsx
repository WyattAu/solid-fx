// Source: demo harness derived from github.com/codse/animata animata/background/animated-beam.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import AnimatedBeam from './AnimatedBeam'

function AnimatedBeamDemo() {
  return (
    <AnimatedBeam class="h-96 w-full rounded-lg border border-gray-800">
      <div class="flex h-full w-full items-center justify-center">
        <p class="relative z-10 text-center text-lg font-semibold text-white">
          Ships in the night
        </p>
      </div>
    </AnimatedBeam>
  )
}

export default AnimatedBeamDemo
