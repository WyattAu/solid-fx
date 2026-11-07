// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Demo concept from EXTRAS-ROADMAP.md P2.
import Particles from './Particles'

function ParticlesDemo() {
  return (
    <div class="flex h-96 w-full flex-col gap-4 p-4">
      <div class="relative h-64 w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
        <Particles count={90} color="#818cf8" speed={1.2} linkDistance={140} interactive="both" />
      </div>
      <p class="text-sm text-gray-500">
        move the pointer over the field — repulse on hover, bigger push on click
        (@tsparticles/slim).
      </p>
    </div>
  )
}

export default ParticlesDemo
