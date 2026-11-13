// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: none — educational reference grid (browsers cannot open raw TCP sockets; no packets are sent).
import { createSignal, onCleanup, onMount, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import GridPattern from '@/extras/magic-ui/Ui/GridPattern/GridPattern'

export interface PortSpec {
  port: number
  service: string
  description: string
}

export interface PortScanVizProps {
  /** Label for the scan target (display only — this widget never sends packets). */
  host?: string
  /** Ports to render (default: 10 common TCP services). */
  ports?: PortSpec[]
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const DEFAULT_PORTS: PortSpec[] = [
  { port: 21, service: 'FTP', description: 'File transfer (cleartext)' },
  { port: 22, service: 'SSH', description: 'Secure shell / SFTP' },
  { port: 25, service: 'SMTP', description: 'Mail relay' },
  { port: 53, service: 'DNS', description: 'Name resolution (TCP fallback)' },
  { port: 80, service: 'HTTP', description: 'Web traffic (cleartext)' },
  { port: 443, service: 'HTTPS', description: 'Web over TLS' },
  { port: 3306, service: 'MySQL', description: 'Database listener' },
  { port: 3389, service: 'RDP', description: 'Windows remote desktop' },
  { port: 5432, service: 'PostgreSQL', description: 'Database listener' },
  { port: 8080, service: 'HTTP-alt', description: 'Proxy / dev servers' },
]

const PortScanViz = (props: PortScanVizProps) => {
  const ports = () => (props.ports && props.ports.length > 0 ? props.ports : DEFAULT_PORTS)

  // Decorative sweep index: -1 = idle, n = the cell the "probe" beam is over.
  // It visualizes the pass order only — it is NOT a connectivity result.
  const [sweep, setSweep] = createSignal(-1)

  onMount(() => {
    let controls: ReturnType<typeof animate> | null = null
    // Wait one frame so the grid has laid out before the beam starts.
    const start = requestAnimationFrame(() => {
      controls = animate(0, ports().length, {
        duration: 6,
        ease: 'linear',
        repeat: Infinity,
        repeatDelay: 1.2,
        onUpdate: latest => setSweep(Math.min(Math.floor(latest), ports().length - 1)),
      })
    })
    onCleanup(() => {
      cancelAnimationFrame(start)
      controls?.stop()
    })
  })

  const hostLabel = () => props.host?.trim() || 'unspecified host'

  return (
    <div
      class={`relative flex h-full w-full flex-col gap-3 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    >
      <GridPattern
        width={28}
        height={28}
        class="fill-sky-400/10 stroke-sky-400/10 [mask-image:radial-gradient(60%_60%_at_center,white,transparent)]"
      />
      <div class="relative z-[1] flex items-baseline justify-between gap-3">
        <h3 class="font-mono text-sm font-semibold tracking-widest text-sky-300 uppercase">
          Port reference
        </h3>
        <span class="truncate font-mono text-xs text-neutral-400">{hostLabel()}</span>
      </div>

      <div class="relative z-[1] grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-auto md:grid-cols-5">
        <For each={ports()}>
          {(spec, index) => (
            <div
              class="flex flex-col justify-between rounded-lg border p-2.5 transition-colors duration-300"
              classList={{
                'border-sky-400/40 bg-sky-400/10': sweep() === index(),
                'border-white/10 bg-white/[0.03]': sweep() !== index(),
              }}
            >
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-mono text-lg font-bold text-neutral-100">{spec.port}</span>
                <span
                  class="h-2 w-2 rounded-full transition-colors duration-300"
                  classList={{
                    'bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.9)]': sweep() === index(),
                    'bg-neutral-700': sweep() !== index(),
                  }}
                />
              </div>
              <span class="font-mono text-xs font-semibold tracking-wide text-sky-200">
                {spec.service}
              </span>
              <span class="text-[11px] leading-tight text-neutral-400">{spec.description}</span>
            </div>
          )}
        </For>
      </div>

      <p class="relative z-[1] text-[11px] leading-snug text-neutral-500">
        Educational reference — browsers cannot open raw TCP sockets, so no scan is performed and no
        packets are sent. The travelling beam only visualizes the pass order.
        <Show when={props.host}>
          {' '}
          To actually probe <span class="font-mono text-neutral-400">{hostLabel()}</span>, run
          nmap/masscan from a host you are authorized to scan.
        </Show>
      </p>
    </div>
  )
}

export default PortScanViz
