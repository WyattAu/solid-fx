// Source: github.com/ibelick/motion-primitives app/docs/progressive-blur/progressive-blur-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import ProgressiveBlur from './ProgressiveBlur'

function ProgressiveBlurDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800">
      <img
        src="https://picsum.photos/seed/progressive-blur/800/500"
        alt="Demo"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <ProgressiveBlur
        class="absolute inset-x-0 bottom-0 h-2/3"
        direction="top"
        blurLayers={8}
        blurIntensity={0.4}
      />
      <p class="absolute bottom-6 left-0 w-full text-center font-mono text-sm text-white">
        Progressive blur fade at the bottom edge
      </p>
    </div>
  )
}

export default ProgressiveBlurDemo
