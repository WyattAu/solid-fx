import LiquidEther from './LiquidEther'

function LiquidEtherDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <LiquidEther class="h-full w-full" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <LiquidEther
          class="h-full w-full"
          colors={['#00d4ff', '#7c3aed', '#f0abfc']}
          mouseForce={28}
          cursorSize={120}
          viscosity={0.15}
          backgroundColor="#05060f"
        />
      </div>
    </div>
  )
}

export default LiquidEtherDemo
