// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import LoopPulse from './LoopPulse'

function LoopPulseDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-gray-950 p-8 text-white">
      <LoopPulse
        grid={[5, 11]}
        dotSize={10}
        gap={12}
        accent="#818cf8"
        staggerDelay={40}
        duration={700}
        cycleMs={2400}
      />
      <p class="text-sm text-gray-500">
        createTimer master clock fires one animate() pulse per loop — center-out grid stagger,
        alternate scale + color keyframes.
      </p>
    </div>
  )
}

export default LoopPulseDemo
