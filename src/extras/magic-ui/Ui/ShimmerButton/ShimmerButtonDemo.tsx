// Source: github.com/magicuidesign/magic-ui apps/www/registry/example/shimmer-button-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import ShimmerButton from './ShimmerButton'

function ShimmerButtonDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 text-white">
      <ShimmerButton
        shimmerColor="#ffffff"
        background="rgba(0, 0, 0, 1)"
        class="shadow-2xl"
      >
        <span class="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white lg:text-lg">
          Shimmer Button
        </span>
      </ShimmerButton>
    </div>
  )
}

export default ShimmerButtonDemo
