// Source: github.com/magicuidesign/magicui apps/www/registry/example/morphing-text-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream demo renders the text on a bare docs page; staged here on a dark
// surface. One instance per page — the `#threshold` SVG filter id is global.
import MorphingText from './MorphingText'

const texts = ['Solid', 'Morphing', 'Text', 'Animation', 'Component', 'Smooth', 'Transition']

function MorphingTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8 text-white">
      <MorphingText texts={texts} />
    </div>
  )
}

export default MorphingTextDemo
