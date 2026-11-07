// Source: github.com/magicuidesign/magicui apps/www/registry/example/meteors-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
// Upstream demo renders theme-aware gradient text; pinned to the dark variant
// so it reads on the docs' dark stage.
import Meteors from './Meteors'

function MeteorsDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <Meteors number={30} />
      <span class="pointer-events-none bg-linear-to-b from-white to-slate-900/10 bg-clip-text text-center text-8xl leading-none font-semibold whitespace-pre-wrap text-transparent">
        Meteors
      </span>
    </div>
  )
}

export default MeteorsDemo
