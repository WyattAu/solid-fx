// Source: github.com/magicuidesign/magicui apps/www/registry/example/ripple-demo.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
// Upstream demo uses the `bg-background` shadcn token; pinned to the dark
// stage colors used by the docs site.
import Ripple from './Ripple'

function RippleDemo() {
  return (
    <div class="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <p class="z-10 text-center text-5xl font-medium tracking-tighter whitespace-pre-wrap text-white">
        Ripple
      </p>
      <Ripple />
    </div>
  )
}

export default RippleDemo
