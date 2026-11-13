// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: RDAP (rdap.org/domain, IETF registration data access protocol, no key).
import WhoisLookup from './WhoisLookup'

function WhoisLookupDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 70% 25%, rgba(251,191,36,0.1), transparent 55%), radial-gradient(circle at 25% 85%, rgba(244,63,94,0.08), transparent 50%)',
        }}
      />
      <WhoisLookup domain="example.com" />
    </div>
  )
}

export default WhoisLookupDemo
