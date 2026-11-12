// Source: demo harness derived from github.com/codse/animata animata/text/swap-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import SwapText from './SwapText'

function SwapTextDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-12 rounded-lg border border-gray-800 bg-gray-950 px-6">
      {/* PORT-NOTE: caller colors go through `style` (see component PORT-NOTE) */}
      <SwapText
        initialText="Open"
        finalText="Close"
        supportsHover={true}
        disableClick={false}
        style={{ color: '#ffffff' }}
      />
      <SwapText
        initialText="Menu"
        finalText="Close"
        supportsHover={false}
        style={{ color: '#22d3ee' }}
      />
    </div>
  )
}

export default SwapTextDemo
