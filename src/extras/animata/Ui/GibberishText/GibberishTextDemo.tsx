// Source: demo harness derived from github.com/codse/animata animata/text/gibberish-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import GibberishText from './GibberishText'

function GibberishTextDemo() {
  return (
    <div class="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <p class="font-mono text-3xl text-neutral-100">
        <GibberishText text="SOLID FX" />
      </p>
    </div>
  )
}

export default GibberishTextDemo
