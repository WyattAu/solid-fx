import Orb from './Orb'

function OrbDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Orb class="h-full w-full" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Orb
          class="h-full w-full"
          colors={['#ff5f6d', '#ffc371', '#2b1055']}
          backgroundColor="#0a0a12"
          hue={20}
          glow={1.4}
          tiltY={18}
        />
      </div>
    </div>
  )
}

export default OrbDemo
