// Source: github.com/magicuidesign/magicui apps/www/registry/example/hexagon-pattern-demo.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import HexagonPattern from './HexagonPattern'

function HexagonPatternDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <HexagonPattern
        hexagons={[
          [1, 1],
          [4, 4],
          [2, 2],
          [3, 4],
          [5, 4],
          [8, 2],
          [6, 3],
          [8, 5],
          [10, 10],
        ]}
        class="inset-0 skew-y-6 [mask-image:radial-gradient(420px_circle_at_center,white,transparent)]"
      />
    </div>
  )
}

export default HexagonPatternDemo
