// Source: github.com/magicuidesign/magicui apps/www/registry/example/flickering-grid-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
// Upstream demo uses the theme background token; pinned to the docs' dark stage.
import FlickeringGrid from './FlickeringGrid'

function FlickeringGridDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <FlickeringGrid
        class="absolute inset-0 z-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
        height={800}
        width={800}
      />
    </div>
  )
}

export default FlickeringGridDemo
