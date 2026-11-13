// Source: demo harness derived from github.com/codse/animata animata/text/jitter-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import JitterText from './JitterText'

function JitterTextDemo() {
  return (
    <div class="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <JitterText text="Jitter Text" duration={0.6} class="text-6xl font-black text-neutral-100" />
    </div>
  )
}

export default JitterTextDemo
