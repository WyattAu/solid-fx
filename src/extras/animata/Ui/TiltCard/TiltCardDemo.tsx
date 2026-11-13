// Source: demo harness derived from github.com/codse/animata animata/card/tilted-card.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import TiltCard from './TiltCard'

function TiltCardDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <TiltCard title="Hover to tilt" class="text-gray-900" />
    </div>
  )
}

export default TiltCardDemo
