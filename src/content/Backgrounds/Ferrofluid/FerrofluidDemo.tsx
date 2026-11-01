import Ferrofluid from './Ferrofluid'

function FerrofluidDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Ferrofluid
          class="h-full w-full"
          colors={['#7dd3fc', '#e0f2fe', '#38bdf8']}
          spikeHeight={1.2}
        />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Ferrofluid
          class="h-full w-full"
          colors={['#f472b6', '#fb7185', '#fdba74']}
          sharpness={4}
          turbulence={1.6}
          flowDirection="right"
        />
      </div>
    </div>
  )
}

export default FerrofluidDemo
