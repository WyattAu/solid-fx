// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: RIPEstat announced-prefixes (stat.ripe.net, no key, CORS-open).
import AsnPrefixes from './AsnPrefixes'

function AsnPrefixesDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 70% 20%, rgba(6,182,212,0.12), transparent 55%), radial-gradient(circle at 30% 80%, rgba(139,92,246,0.1), transparent 50%)',
        }}
      />
      <AsnPrefixes asn={13335} class="h-full" />
    </div>
  )
}

export default AsnPrefixesDemo
