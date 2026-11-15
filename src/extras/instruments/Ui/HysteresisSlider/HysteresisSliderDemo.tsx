// solid-fx Instruments widget — original component (not a port).
import HysteresisSlider from './HysteresisSlider'

function HysteresisSliderDemo() {
  return (
    <div class="flex w-full flex-col justify-center gap-6 p-6">
      <HysteresisSlider
        label="CPU alert (fires > trigger, clears < reset)"
        min={0}
        max={100}
        trigger={85}
        reset={60}
      />
      <HysteresisSlider
        label="Memory pressure (Pa)"
        min={0}
        max={4000}
        trigger={3200}
        reset={1800}
        minGap={400}
        step={20}
      />
    </div>
  )
}

export default HysteresisSliderDemo
