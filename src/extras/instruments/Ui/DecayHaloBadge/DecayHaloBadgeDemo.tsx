// solid-fx Instruments widget — original component (not a port).
// Demo: three feeds at different ages — fresh, one half-life old, stale —
// against a 45-second half-life so the decay is visible without waiting.
import DecayHaloBadge from './DecayHaloBadge'

function DecayHaloBadgeDemo() {
  const now = Date.now()
  return (
    <div class="flex w-full flex-col items-start justify-center gap-4 p-6">
      <DecayHaloBadge timestamp={now - 5_000} halfLifeMs={45_000} label="market feed" />
      <DecayHaloBadge timestamp={now - 45_000} halfLifeMs={45_000} label="sensor mesh" />
      <DecayHaloBadge timestamp={now - 240_000} halfLifeMs={45_000} label="archive poll" />
    </div>
  )
}

export default DecayHaloBadgeDemo
