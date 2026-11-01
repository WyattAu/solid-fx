import SpotlightCard from './SpotlightCard'

function SpotlightCardDemo() {
  return (
    <div class="flex w-full max-w-3xl flex-col items-center justify-center gap-6 p-8 sm:flex-row">
      <SpotlightCard class="w-full text-white sm:w-64">
        <p class="text-xs tracking-widest text-white/40 uppercase">circle</p>
        <p class="mt-2 text-lg font-semibold">Hover me</p>
        <p class="mt-1 text-sm text-white/50">The spotlight follows the pointer.</p>
      </SpotlightCard>
      <SpotlightCard
        class="w-full text-white sm:w-64"
        shape="beam"
        ambient
        spotlightColor="#60a5fa"
      >
        <p class="text-xs tracking-widest text-white/40 uppercase">beam + ambient</p>
        <p class="mt-2 text-lg font-semibold">Top light</p>
        <p class="mt-1 text-sm text-white/50">Drifts on its own when idle.</p>
      </SpotlightCard>
      <SpotlightCard
        class="w-full text-white sm:w-64"
        spotlightColor="#f472b6"
        grain={0.5}
        proximity={140}
        borderGlow={0.9}
      >
        <p class="text-xs tracking-widest text-white/40 uppercase">grain + glow</p>
        <p class="mt-2 text-lg font-semibold">Feel the edge</p>
        <p class="mt-1 text-sm text-white/50">Reacts before you arrive.</p>
      </SpotlightCard>
    </div>
  )
}

export default SpotlightCardDemo
