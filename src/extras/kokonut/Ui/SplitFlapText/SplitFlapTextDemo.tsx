// Source: github.com/kokonut-labs/kokonutui components/kokonutui/split-flap-text.tsx@a16d64c0d99ab5c6304ebcb88860d8d8bf201fd0. License: MIT.
// Upstream ships no standalone demo file; harness per PORTING.md §6.
import SplitFlapText from './SplitFlapText'

function SplitFlapTextDemo() {
  return (
    <div class="flex h-64 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <SplitFlapText words={['NOW BOARDING', 'GATE 12', 'ON TIME', 'LAST CALL']} />
    </div>
  )
}

export default SplitFlapTextDemo
