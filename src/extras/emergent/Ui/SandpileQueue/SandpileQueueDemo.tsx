// solid-fx Emergent widget — original component (not a port).
import SandpileQueue from './SandpileQueue'

function SandpileQueueDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <SandpileQueue
        label="deploy queue (auto-drop 500ms)"
        autoDropMs={500}
        cells={12}
        cellSize={24}
      />
      <SandpileQueue
        label="incident backlog (manual)"
        autoDropMs={0}
        cells={10}
        cellSize={26}
        seed={0x51}
      />
    </div>
  )
}

export default SandpileQueueDemo
