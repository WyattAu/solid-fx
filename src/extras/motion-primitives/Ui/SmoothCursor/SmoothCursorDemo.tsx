// Demo harness for the SmoothCursor port. Dark-stage friendly, self-contained.
// The spring cursor starts at 0/0, fades in on the first pointer move, hides
// the native cursor while mounted (upstream behavior), and rotates with
// pointer velocity.
import SmoothCursor from './SmoothCursor'

function SmoothCursorDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <SmoothCursor springConfig={{ damping: 45, stiffness: 400, mass: 1, restDelta: 0.001 }} />
      <p class="text-lg font-medium text-white">Smooth cursor</p>
      <p class="max-w-xs text-center text-sm text-neutral-400">
        Move your pointer — a spring-followed arrow rotates into the direction of travel and
        squash-scales with speed.
      </p>
    </div>
  )
}

export default SmoothCursorDemo
