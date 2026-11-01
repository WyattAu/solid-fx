import LightRays from './LightRays'

const LightRaysDemo = () => (
  <div class="relative h-96 w-full overflow-hidden bg-black">
    <LightRays
      raysOrigin="top-center"
      raysColor="#ffffff"
      raysSpeed={1}
      lightSpread={0.6}
      rayLength={3}
      rayDensity={1.2}
      pulsating
    />
  </div>
)

export default LightRaysDemo
