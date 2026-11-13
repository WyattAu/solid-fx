// Source: demo harness derived from github.com/codse/animata animata/button/ripple-button.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import RippleButton from './RippleButton'

function RippleButtonDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 rounded-lg border border-gray-800 bg-gray-950">
      <RippleButton>Hover me</RippleButton>
      <span class="text-xs text-neutral-500">
        A dark ripple expands under the cursor while hovered
      </span>
    </div>
  )
}

export default RippleButtonDemo
