// Demo harness for the ScrollVelocity port. Dark-stage friendly,
// self-contained. Rows marquee at base velocity; page scrolling bends their
// speed and direction (scroll down = forward, scroll up = reverse).
import { ScrollVelocityContainer, ScrollVelocityRow } from './ScrollVelocity'

function ScrollVelocityDemo() {
  return (
    <div class="flex h-96 w-full flex-col justify-center gap-6 overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <ScrollVelocityContainer>
        <ScrollVelocityRow baseVelocity={4} class="text-4xl font-semibold text-white/90">
          <span class="pr-10">Scroll velocity</span>
          <span class="text-white/30">✦</span>
        </ScrollVelocityRow>
        <ScrollVelocityRow
          baseVelocity={4}
          direction={-1}
          class="text-4xl font-semibold text-white/40"
        >
          <span class="pr-10">Motion for Solid</span>
          <span class="text-white/20">◆</span>
        </ScrollVelocityRow>
        <p class="px-6 text-center text-sm text-neutral-500">
          Scroll the page — row speed and direction react to scroll velocity.
        </p>
      </ScrollVelocityContainer>
    </div>
  )
}

export default ScrollVelocityDemo
