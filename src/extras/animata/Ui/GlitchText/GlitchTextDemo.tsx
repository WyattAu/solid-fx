// Source: demo harness derived from github.com/codse/animata animata/text/glitch-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import GlitchText from './GlitchText'

function GlitchTextDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-lg border border-gray-800 bg-gray-950">
      <GlitchText class="text-4xl font-bold text-white" duration={2.5}>
        SYSTEM ERROR
      </GlitchText>
      <span class="text-xs text-neutral-500">
        Magenta + cyan ghost layers burst every glitch cycle
      </span>
    </div>
  )
}

export default GlitchTextDemo
