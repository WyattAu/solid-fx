// Source: demo harness derived from github.com/codse/animata animata/button/shining-button.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import ShiningButton from './ShiningButton'

function ShiningButtonDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 rounded-lg border border-gray-800 bg-gray-950">
      <ShiningButton />
      <span class="text-xs text-neutral-500">Hover the button for the shine sweep</span>
    </div>
  )
}

export default ShiningButtonDemo
