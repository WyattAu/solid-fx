import PixelTrail from './PixelTrail'

function PixelTrailDemo() {
  return (
    <div class="h-96 w-full overflow-hidden rounded-2xl border border-white/10">
      <PixelTrail class="h-full w-full" gridSize={48} trailSize={0.4} maxAge={500} />
    </div>
  )
}

export default PixelTrailDemo
