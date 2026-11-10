// Source: github.com/magicuidesign/magicui apps/www/registry/example/animated-shiny-text-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import AnimatedShinyText from './AnimatedShinyText'

function AnimatedShinyTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="group rounded-full border border-white/5 bg-neutral-950 px-4 py-1.5 text-sm text-white/60 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-8px_10px_#8fdfff4f]">
        ✨ Introducing
        <AnimatedShinyText class="ml-2 inline-flex items-center px-1">
          <span> Magic UI </span>
          <span class="ml-1">→</span>
        </AnimatedShinyText>
      </div>
    </div>
  )
}

export default AnimatedShinyTextDemo
