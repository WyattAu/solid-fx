import Crosshair from './Crosshair'

function CrosshairDemo() {
  const holder: { current: HTMLElement | null } = { current: null }

  return (
    <div
      ref={el => (holder.current = el)}
      class="relative h-96 w-full overflow-hidden bg-neutral-950"
    >
      <Crosshair containerRef={holder} hideCursor targetEffect="lock" />
      <div class="flex h-full flex-col items-center justify-center gap-4">
        <span class="text-xs tracking-wide text-neutral-500 uppercase">
          crosshair follows the cursor
        </span>
        <button
          type="button"
          data-crosshair-target
          class="rounded-lg border border-neutral-700 px-6 py-3 text-sm text-neutral-100 hover:border-neutral-500"
        >
          Lock target
        </button>
      </div>
    </div>
  )
}

export default CrosshairDemo
