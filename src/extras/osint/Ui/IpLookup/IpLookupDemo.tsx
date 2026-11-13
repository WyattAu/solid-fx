// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: ipwho.is (IP geolocation, no key).
import IpLookup from './IpLookup'

function IpLookupDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 25% 20%, rgba(16,185,129,0.14), transparent 55%), radial-gradient(circle at 80% 85%, rgba(59,130,246,0.12), transparent 50%)',
        }}
      />
      <IpLookup class="h-full" />
    </div>
  )
}

export default IpLookupDemo
