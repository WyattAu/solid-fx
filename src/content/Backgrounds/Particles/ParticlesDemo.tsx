import Particles from './Particles'

function ParticlesDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Particles class="h-full w-full" particleColors={['#ffffff', '#a78bfa', '#38bdf8']} />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Particles
          class="h-full w-full"
          shape="sparkle"
          glow={1}
          twinkle={0.6}
          connections
          particleColors={['#fbbf24']}
          particleCount={120}
        />
      </div>
    </div>
  )
}

export default ParticlesDemo
