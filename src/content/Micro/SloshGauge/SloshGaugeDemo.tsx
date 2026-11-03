import SloshGauge from './SloshGauge'

function SloshGaugeDemo() {
  return (
    <div class="flex h-72 items-center justify-center p-8">
      <SloshGauge defaultValue={64} showValue interactive />
    </div>
  )
}

export default SloshGaugeDemo
