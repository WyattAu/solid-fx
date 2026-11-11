// Source: github.com/kokonut-labs/kokonutui components/kokonutui/caustics-background.tsx@a16d64c0d99ab5c6304ebcb88860d8d8bf201fd0. License: MIT.
// Upstream ships no standalone demo file; harness per PORTING.md §6.
// The component carries its own light/dark surface tokens and default copy.
import CausticsBackground from './CausticsBackground'

function CausticsDemo() {
  return (
    <div class="w-full overflow-hidden rounded-lg border border-gray-800">
      <CausticsBackground title="Swim before work." />
    </div>
  )
}

export default CausticsDemo
