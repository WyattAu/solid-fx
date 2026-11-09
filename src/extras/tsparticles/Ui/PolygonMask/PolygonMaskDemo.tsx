// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Demo concept from EXTRAS-ROADMAP.md P2.
import PolygonMask from './PolygonMask'

function PolygonMaskDemo() {
  return (
    <div class="flex h-96 w-full flex-col gap-4 p-4">
      <div class="grid h-64 w-full grid-cols-2 gap-4">
        <div class="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
          <PolygonMask
            sides={6}
            radius={110}
            area="inside"
            count={150}
            speed={1.5}
            strokeColor="#818cf8"
          />
          <p class="absolute bottom-2 left-0 w-full text-center text-xs text-gray-500">
            area: inside
          </p>
        </div>
        <div class="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
          <PolygonMask
            sides={3}
            radius={100}
            area="inline"
            count={200}
            speed={4}
            strokeColor="#34d399"
          />
          <p class="absolute bottom-2 left-0 w-full text-center text-xs text-gray-500">
            area: inline
          </p>
        </div>
      </div>
      <p class="text-sm text-gray-500">
        particles constrained to a polygon via @tsparticles/plugin-polygon-mask — sides/radius/area
        shape the mask, particles bounce off its walls or ride its edge.
      </p>
    </div>
  )
}

export default PolygonMaskDemo
