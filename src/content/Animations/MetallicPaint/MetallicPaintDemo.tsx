import MetallicPaint from './MetallicPaint'

function MetallicPaintDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950">
      <div class="h-64 w-full max-w-2xl">
        <MetallicPaint text="Solid" fontWeight={800} color="#ffffff" scale={0.55} />
      </div>
    </div>
  )
}

export default MetallicPaintDemo
