// Built with tsParticles preset stars (github.com/tsparticles/tsparticles) — Demo concept from EXTRAS-ROADMAP.md P2.
import Stars from './Stars'

function StarsDemo() {
  return (
    <div class="flex h-96 w-full flex-col gap-4 p-4">
      <div class="relative h-64 w-full overflow-hidden rounded-xl border border-gray-800">
        <Stars count={140} twinkleSpeed={1.5} />
      </div>
      <p class="text-sm text-gray-500">
        twinkling night sky — random slow drift plus opacity twinkle (@tsparticles/preset-stars).
      </p>
    </div>
  )
}

export default StarsDemo
