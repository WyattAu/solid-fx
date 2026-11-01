import Lightfall from './Lightfall'

const LightfallDemo = () => (
  <div class="relative h-96 w-full overflow-hidden bg-black">
    <Lightfall
      colors={['#ffffff', '#8ab4ff']}
      speed={0.35}
      streakCount={3}
      glow={1.1}
      bloom={0.4}
      zoom={3}
    />
  </div>
)

export default LightfallDemo
