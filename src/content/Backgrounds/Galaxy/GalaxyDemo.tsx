import Galaxy from './Galaxy'

function GalaxyDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Galaxy class="h-full w-full" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Galaxy
          class="h-full w-full"
          starColors={['#ffd6a5', '#9bf6ff', '#ffadad', '#caffbf']}
          starSpeed={0.8}
          rotationSpeed={0.15}
          layers={5}
          density={1.2}
        />
      </div>
    </div>
  )
}

export default GalaxyDemo
