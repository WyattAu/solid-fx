// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: none — educational reference grid (browsers cannot open raw TCP sockets; no packets are sent).
import PortScanViz from './PortScanViz'

function PortScanVizDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.12), transparent 55%), radial-gradient(circle at 85% 90%, rgba(34,197,94,0.08), transparent 50%)',
        }}
      />
      <PortScanViz host="demo.internal-lab" />
    </div>
  )
}

export default PortScanVizDemo
