// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: BGPView (api.bgpview.io/asn, no key) with RIPEstat (stat.ripe.net, no key) fallback.
import BgpAsnInfo from './BgpAsnInfo'

function BgpAsnInfoDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.14), transparent 55%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.1), transparent 50%)',
        }}
      />
      <BgpAsnInfo asn={13335} class="h-full" />
    </div>
  )
}

export default BgpAsnInfoDemo
