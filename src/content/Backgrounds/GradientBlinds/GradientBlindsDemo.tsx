import GradientBlinds from './GradientBlinds'

const GradientBlindsDemo = () => (
  <div class="h-96 w-full">
    <GradientBlinds
      gradientColors={['#FF9FFC', '#5227FF']}
      angle={0}
      blindCount={16}
      glow={0.4}
      sway={0.35}
    />
  </div>
)

export default GradientBlindsDemo
