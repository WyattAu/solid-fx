import AnimatedCircularProgressBar from './AnimatedCircularProgressBar'

function AnimatedCircularProgressBarDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <AnimatedCircularProgressBar
        max={100}
        min={0}
        value={68}
        gaugePrimaryColor="rgb(79 70 229)"
        gaugeSecondaryColor="rgba(255,255,255,0.1)"
      />
    </div>
  )
}

export default AnimatedCircularProgressBarDemo
