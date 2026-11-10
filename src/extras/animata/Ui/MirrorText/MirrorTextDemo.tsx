// Source: demo harness derived from github.com/codse/animata animata/text/mirror-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import MirrorText from './MirrorText'

function MirrorTextDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 rounded-lg border border-gray-800 bg-gray-950">
      <MirrorText text="ANIMATA" direction="up" class="text-neutral-100" />
      <span class="text-xs text-neutral-500">Hover the text to mirror-shift it</span>
    </div>
  )
}

export default MirrorTextDemo
