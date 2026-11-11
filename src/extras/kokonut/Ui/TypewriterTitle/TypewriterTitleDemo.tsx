// Source: github.com/kokonut-labs/kokonutui components/kokonutui/type-writer.tsx@a16d64c0d99ab5c6304ebcb88860d8d8bf201fd0. License: MIT.
// Upstream ships no standalone demo file; harness per PORTING.md §6.
import TypewriterTitle from './TypewriterTitle'

function TypewriterTitleDemo() {
  return (
    <div class="flex h-64 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <TypewriterTitle
        sequences={[
          { text: 'SolidJS ports', deleteAfter: true },
          { text: 'with typos and fixes', deleteAfter: true },
          { text: 'kokonutui', deleteAfter: false },
        ]}
        textClassName="text-gray-100"
        typos
      />
    </div>
  )
}

export default TypewriterTitleDemo
