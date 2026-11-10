// Demo harness for the Cursor port. Dark-stage friendly, self-contained.
// The custom cursor starts centered (like upstream: window center), follows
// the pointer with a spring, and hides the native cursor while mounted.
import Cursor from './Cursor'

function CursorDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <Cursor
        transition={{ duration: 0.15 }}
        variants={{
          initial: { opacity: 0, scale: 0.5 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.5 },
        }}
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/10 backdrop-blur-sm">
          <div class="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
      </Cursor>
      <p class="text-lg font-medium text-white">Custom cursor</p>
      <p class="max-w-xs text-center text-sm text-neutral-400">
        Move your pointer — the native cursor is hidden and replaced by a spring-followed ring.
      </p>
    </div>
  )
}

export default CursorDemo
