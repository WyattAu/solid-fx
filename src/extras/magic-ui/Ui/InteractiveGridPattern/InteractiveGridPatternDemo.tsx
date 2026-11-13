// Source: github.com/magicuidesign/magicui apps/www/registry/example/interactive-grid-pattern-demo.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import InteractiveGridPattern from './InteractiveGridPattern'

function InteractiveGridPatternDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <InteractiveGridPattern class="inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]" />
    </div>
  )
}

export default InteractiveGridPatternDemo
