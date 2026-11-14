// Source: github.com/magicuidesign/magicui apps/www/registry/example/line-shadow-text-demo.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream demo reads next-themes for the shadow color; fixed to white here
// and staged on a dark surface so the diagonal sweep stays visible.
import LineShadowText from './LineShadowText'

function LineShadowTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <h1 class="text-6xl leading-none font-semibold tracking-tighter text-white sm:text-7xl">
        Ship{' '}
        <LineShadowText class="italic" shadowColor="white">
          Fast
        </LineShadowText>
      </h1>
    </div>
  )
}

export default LineShadowTextDemo
