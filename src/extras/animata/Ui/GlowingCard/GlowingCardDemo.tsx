// Source: demo harness derived from github.com/codse/animata animata/card/glowing-card.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import GlowingCard from './GlowingCard'

function GlowingCardDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center gap-10 rounded-lg border border-gray-800 bg-gray-950">
      <GlowingCard />
      <GlowingCard fromColor="#22d3ee" viaColor="#a855f7" toColor="#f43f5e" />
    </div>
  )
}

export default GlowingCardDemo
