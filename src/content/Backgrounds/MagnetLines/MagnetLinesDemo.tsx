import MagnetLines from './MagnetLines'

function MagnetLinesDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="grid h-96 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gray-950">
        <MagnetLines containerSize={280} lineColor="#a78bfa" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-gray-950">
        <MagnetLines
          class="h-full w-full"
          lineColor="#e0e7ff"
          accentColor="#f43f5e"
          shape="needle"
          spacing={34}
          tiltY={24}
        />
      </div>
    </div>
  )
}

export default MagnetLinesDemo
