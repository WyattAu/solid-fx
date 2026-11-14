// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: archive.org CDX (web.archive.org/cdx, no key, CORS-open).
import WaybackTimeline from './WaybackTimeline'

function WaybackTimelineDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 75% 15%, rgba(34,211,238,0.12), transparent 55%), radial-gradient(circle at 25% 85%, rgba(139,92,246,0.1), transparent 50%)',
        }}
      />
      <WaybackTimeline url="example.com" class="h-full" />
    </div>
  )
}

export default WaybackTimelineDemo
