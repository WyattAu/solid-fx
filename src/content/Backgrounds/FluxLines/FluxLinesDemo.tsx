import FluxLines from './FluxLines'

function FluxLinesDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <FluxLines class="h-full w-full" colors={['#38bdf8', '#818cf8', '#e0f2fe']} glow={2.4} />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <FluxLines
          class="h-full w-full"
          colors={['#fb7185', '#fdba74', '#fef3c7']}
          flowDirection="right"
          turbulence={1.6}
          shimmer={2.2}
          rimWidth={0.3}
        />
      </div>
    </div>
  )
}

export default FluxLinesDemo
