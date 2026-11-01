import DarkVeil from './DarkVeil'

function DarkVeilDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <DarkVeil class="h-full w-full" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <DarkVeil
          class="h-full w-full"
          color="#00e5ff"
          speed={0.8}
          warp={0.6}
          sheen={0.4}
          glow={0.7}
          variation={3}
        />
      </div>
    </div>
  )
}

export default DarkVeilDemo
