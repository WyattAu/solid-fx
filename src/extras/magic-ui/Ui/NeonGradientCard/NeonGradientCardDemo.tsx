// Source: github.com/magicuidesign/magicui apps/www/registry/example/neon-gradient-card-demo.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import NeonGradientCard from './NeonGradientCard'

function NeonGradientCardDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-8">
      <NeonGradientCard class="max-w-sm items-center justify-center text-center">
        <span class="pointer-events-none z-10 h-full bg-linear-to-br from-[#ff2975] from-35% to-[#00FFF1] bg-clip-text text-center text-3xl leading-none font-bold tracking-tighter whitespace-pre-wrap text-balance text-transparent dark:drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
          Neon Gradient Card
        </span>
      </NeonGradientCard>
    </div>
  )
}

export default NeonGradientCardDemo
