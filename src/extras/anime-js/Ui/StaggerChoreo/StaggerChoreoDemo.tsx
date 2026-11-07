// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import StaggerChoreo from './StaggerChoreo'

function StaggerChoreoDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-gray-950 p-8 text-white">
      <StaggerChoreo
        grid={[5, 9]}
        cellSize={26}
        gap={10}
        accent="#818cf8"
        staggerDelay={65}
        duration={700}
      />
      <p class="text-sm text-gray-500">
        stagger&#123; grid, from: 'center' &#125; — one animate() call, center-out ripple.
      </p>
    </div>
  )
}

export default StaggerChoreoDemo
