// Source: github.com/magicuidesign/magicui apps/www/registry/example/aurora-text-demo.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
// Upstream demo renders on the page background; wrapped in the docs' dark
// stage.
import AuroraText from './AuroraText'

function AuroraTextDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <h1 class="text-center text-4xl font-bold tracking-tighter text-white md:text-5xl lg:text-7xl">
        Ship <AuroraText>beautiful</AuroraText>
      </h1>
    </div>
  )
}

export default AuroraTextDemo
