import MagicRings from './MagicRings'

function MagicRingsDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <MagicRings class="h-full w-full" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <MagicRings
          class="h-full w-full"
          color="#22d3ee"
          colorTwo="#a5f3fc"
          motion="breathe"
          ringCount={8}
          tilt={16}
          dispersion={0.6}
          grain={0.15}
        />
      </div>
    </div>
  )
}

export default MagicRingsDemo
