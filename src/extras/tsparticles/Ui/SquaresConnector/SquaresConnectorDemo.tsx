// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Demo concept from EXTRAS-ROADMAP.md P2.
import SquaresConnector from './SquaresConnector'

function SquaresConnectorDemo() {
  return (
    <div class="flex h-96 w-full flex-col gap-4 p-4">
      <div class="relative h-64 w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
        <SquaresConnector count={70} color="#f472b6" speed={1.4} size={5} linkDistance={130} hover="connect" />
      </div>
      <p class="text-sm text-gray-500">
        square particles joined by proximity lines (slim bundle&apos;s `links`); moving the pointer
        knits a denser connector web inside its radius.
      </p>
    </div>
  )
}

export default SquaresConnectorDemo
