import ElectricBorder from './ElectricBorder'

function ElectricBorderDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8">
      <ElectricBorder
        color="#7df9ff"
        glowColor="#00b3ff"
        borderRadius={20}
        thickness={1.6}
        class="w-full max-w-md"
      >
        <div class="rounded-[inherit] bg-gray-950/90 p-8 text-center">
          <h3 class="text-xl font-semibold text-white">Electric border</h3>
          <p class="mt-2 text-sm leading-relaxed text-white/60">
            A WebGL filament traces the rounded outline, flares on load, and surges where the cursor
            passes.
          </p>
        </div>
      </ElectricBorder>
    </div>
  )
}

export default ElectricBorderDemo
