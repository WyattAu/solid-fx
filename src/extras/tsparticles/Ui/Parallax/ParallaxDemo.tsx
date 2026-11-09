// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Demo concept from EXTRAS-ROADMAP.md P2.
import Parallax from './Parallax'

function ParallaxDemo() {
  return (
    <div class="flex h-96 w-full flex-col gap-4 p-4">
      <div class="relative h-64 w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
        <Parallax
          count={120}
          color="#38bdf8"
          speed={0.9}
          minSize={1}
          maxSize={6}
          force={60}
          smooth={10}
        />
      </div>
      <p class="text-sm text-gray-500">
        multi-depth parallax (slim bundle&apos;s parallax mode) — moving the pointer shifts the
        field in layers; bigger dots travel further.
      </p>
    </div>
  )
}

export default ParallaxDemo
