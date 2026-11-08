// Source: github.com/magicuidesign/magicui apps/www/registry/example/ripple-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import Ripple from './Ripple'

function RippleDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <p class="z-10 text-center text-5xl font-medium tracking-tighter whitespace-pre-wrap text-white">
        Ripple
      </p>
      <Ripple />
    </div>
  )
}

export default RippleDemo
