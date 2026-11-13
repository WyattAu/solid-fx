// Source: github.com/magicuidesign/magicui apps/www/registry/example/noise-texture-demo.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import NoiseTexture from './NoiseTexture'

function NoiseTextureDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <span class="pointer-events-none relative z-10 text-sm text-neutral-300">
        Film grain noise texture
      </span>
      <NoiseTexture class="absolute inset-0 [mask-image:radial-gradient(420px_circle_at_center,white,transparent)]" />
    </div>
  )
}

export default NoiseTextureDemo
