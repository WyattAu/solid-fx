// Source: demo harness derived from github.com/codse/animata animata/card/flip-card.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import FlipCard from './FlipCard'

function FlipCardDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 rounded-lg border border-gray-800 bg-gray-950">
      <FlipCard>
        <FlipCard.Front class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-700 bg-linear-to-br from-indigo-950 to-gray-900 text-neutral-100">
          <span class="text-4xl">🃏</span>
          <span class="text-lg font-semibold">Flip Card</span>
          <span class="text-xs text-neutral-400">Hover to flip</span>
        </FlipCard.Front>
        <FlipCard.Back class="flex flex-col items-center justify-center gap-1 rounded-2xl border border-gray-700 bg-gray-900 text-neutral-100">
          <span class="text-lg font-semibold">SolidJS port</span>
          <span class="text-xs text-neutral-400">animata → solid-fx</span>
        </FlipCard.Back>
      </FlipCard>
      <span class="text-xs text-neutral-500">Hover the card to flip it over</span>
    </div>
  )
}

export default FlipCardDemo
