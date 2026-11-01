import Ribbons from './Ribbons'

function RibbonsDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-neutral-950">
      <Ribbons
        colors={['#3847ff', '#7c84ff', '#c7cbff']}
        thickness={26}
        stiffness={0.6}
        bounce={0.55}
        wave={0.4}
        softness={0.45}
        fade
      />
    </div>
  )
}

export default RibbonsDemo
