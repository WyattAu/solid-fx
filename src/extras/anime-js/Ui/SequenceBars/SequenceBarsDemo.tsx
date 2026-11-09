// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import SequenceBars from './SequenceBars'

function SequenceBarsDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-gray-950 p-8 text-white">
      <div class="h-56 w-full max-w-xl">
        <SequenceBars values={[55, 82, 40, 96, 63, 30]} accent="#818cf8" />
      </div>
      <p class="text-sm text-gray-500">
        createTimeline chained segments — staggered grow, label pop-in (`-=` overlap), hold,
        right-to-left retract (`&lt;&lt;`).
      </p>
    </div>
  )
}

export default SequenceBarsDemo
