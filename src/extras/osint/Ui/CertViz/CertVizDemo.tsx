// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: crt.sh certificate transparency log search (no key).
import CertViz from './CertViz'

function CertVizDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(45,212,191,0.12), transparent 55%), radial-gradient(circle at 85% 80%, rgba(59,130,246,0.1), transparent 50%)',
        }}
      />
      <CertViz domain="example.com" />
    </div>
  )
}

export default CertVizDemo
