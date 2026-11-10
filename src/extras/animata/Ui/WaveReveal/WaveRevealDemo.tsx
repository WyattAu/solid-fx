// Source: demo harness derived from github.com/codse/animata animata/text/wave-reveal.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import WaveReveal from './WaveReveal'

function WaveRevealDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <WaveReveal text="Reveal every letter" class="text-neutral-100" />
      <WaveReveal text="Word by word upwards" mode="word" direction="up" class="text-pink-400" />
    </div>
  )
}

export default WaveRevealDemo
