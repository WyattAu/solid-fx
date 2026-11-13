// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: Google DNS-over-HTTPS (dns.google/resolve, no key).
import DnsRecords from './DnsRecords'

function DnsRecordsDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 75% 15%, rgba(56,189,248,0.12), transparent 55%), radial-gradient(circle at 15% 90%, rgba(139,92,246,0.1), transparent 50%)',
        }}
      />
      <DnsRecords domain="example.com" />
    </div>
  )
}

export default DnsRecordsDemo
