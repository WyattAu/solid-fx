import HalftoneReveal from './HalftoneReveal'

function HalftoneRevealDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950">
      <HalftoneReveal
        src="https://picsum.photos/seed/halftone/1200/800"
        mode="duotone"
        accentColor="#ff4f2a"
        cellSize={7}
        revealRadius={180}
        wander
      />
    </div>
  )
}

export default HalftoneRevealDemo
