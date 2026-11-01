import LineWaves from './LineWaves'

const LineWavesDemo = () => (
  <div class="relative h-96 w-full overflow-hidden bg-black">
    <LineWaves
      color1="#ffffff"
      color2="#8ab4ff"
      color3="#5227FF"
      speed={0.35}
      lineCount={80}
      lineWidth={1.3}
      glow={0.7}
      rotation={-33}
    />
  </div>
)

export default LineWavesDemo
