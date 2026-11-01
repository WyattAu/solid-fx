import FluidGlass from './FluidGlass'

function FluidGlassDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-gray-950">
      <img
        src="https://picsum.photos/seed/fluidglass/1200/800"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
      />
      <FluidGlass
        class="absolute inset-0"
        text="Look closer."
        src="https://picsum.photos/seed/fluidglass/1200/800"
        shape="torus"
        size={220}
        interaction="follow"
      />
    </div>
  )
}

export default FluidGlassDemo
