// Source: github.com/magicuidesign/magicui apps/www/registry/example/retro-grid-demo.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
// Upstream demo uses the `bg-background` shadcn token; pinned to the dark
// stage colors used by the docs site.
import RetroGrid from './RetroGrid'

function RetroGridDemo() {
  return (
    <div class="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <span class="pointer-events-none z-10 bg-linear-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text text-center text-7xl leading-none font-bold tracking-tighter whitespace-pre-wrap text-transparent">
        Retro Grid
      </span>

      <RetroGrid />
    </div>
  )
}

export default RetroGridDemo
