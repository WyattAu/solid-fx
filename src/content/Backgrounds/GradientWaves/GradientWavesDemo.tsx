import GradientWaves from './GradientWaves'

const GradientWavesDemo = () => (
  <div class="h-96 w-full">
    <GradientWaves
      horizonColor="#5227FF"
      waveColor="#FF9FFC"
      crestColor="#FFFFFF"
      speed={0.4}
      amplitude={2.5}
      swell={35}
    />
  </div>
)

export default GradientWavesDemo
