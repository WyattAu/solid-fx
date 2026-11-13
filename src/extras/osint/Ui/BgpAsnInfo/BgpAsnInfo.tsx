// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: BGPView (api.bgpview.io/asn, no key) with RIPEstat (stat.ripe.net, no key) fallback.
import { createEffect, createResource, createSignal, onCleanup, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import GlassSurface from '@/content/Components/GlassSurface/GlassSurface'
import TypingAnimation from '@/extras/magic-ui/Ui/TypingAnimation/TypingAnimation'

export interface BgpAsnInfoProps {
  /** Initial ASN to look up (e.g. 13335). */
  asn?: number
  /** Look up on mount (default true). */
  auto?: boolean
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface BgpViewAsnResponse {
  status?: string
  data?: {
    asn?: number
    name?: string
    description?: string
    country_code?: string
    website?: string
    prefixes?: number
    peers?: number
  }
}

interface RipeAsOverview {
  data?: {
    holder?: string
    announced?: boolean
    block?: { desc?: string }
  }
}

interface RipeAnnouncedPrefixes {
  data?: { prefixes?: unknown[] }
}

interface AsnInfo {
  asn: number
  name: string
  description: string
  countryCode: string
  prefixes: number | null
  peers: number | null
  source: 'bgpview' | 'ripestat'
}

interface AsnRow {
  label: string
  value: string
}

const BgpAsnInfo = (props: BgpAsnInfoProps) => {
  const [target, setTarget] = createSignal(props.asn)
  const [draft, setDraft] = createSignal(props.asn != null ? String(props.asn) : '')

  let controller: AbortController | null = null

  const lookup = async (asn: number, signal: AbortSignal): Promise<AsnInfo> => {
    // Primary: BGPView. It has had intermittent outages, so fall back to RIPEstat.
    try {
      const response = await fetch(`https://api.bgpview.io/asn/${asn}`, { signal })
      const payload = (await response.json()) as BgpViewAsnResponse
      if (!response.ok || payload.status !== 'ok' || !payload.data) {
        throw new Error('bgpview returned no data')
      }
      const d = payload.data
      return {
        asn: d.asn ?? asn,
        name: d.name || '—',
        description: d.description || d.name || '—',
        countryCode: d.country_code || '—',
        prefixes: d.prefixes ?? null,
        peers: d.peers ?? null,
        source: 'bgpview',
      }
    } catch (err) {
      if (signal.aborted) throw err
      // Fallback: RIPEstat as-overview (+ announced-prefixes for the count).
      const overviewResponse = await fetch(
        `https://stat.ripe.net/data/as-overview/data.json?resource=AS${asn}`,
        { signal },
      )
      const overview = (await overviewResponse.json()) as RipeAsOverview
      if (!overviewResponse.ok || !overview.data) throw new Error('ASN lookup failed')
      const info: AsnInfo = {
        asn,
        name: overview.data.holder ?? '—',
        description: overview.data.block?.desc ?? '—',
        countryCode: '—',
        prefixes: null,
        peers: null,
        source: 'ripestat',
      }
      if (overview.data.announced) {
        try {
          const prefixesResponse = await fetch(
            `https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS${asn}`,
            { signal },
          )
          const prefixes = (await prefixesResponse.json()) as RipeAnnouncedPrefixes
          info.prefixes = prefixes.data?.prefixes?.length ?? null
        } catch {
          /* prefix count is optional */
        }
      }
      return info
    }
  }

  const [data] = createResource(target, asn => {
    controller?.abort()
    controller = new AbortController()
    return lookup(asn, controller.signal)
  })

  onCleanup(() => controller?.abort())

  createEffect(() => {
    if (props.asn !== undefined && props.asn !== target()) setTarget(props.asn)
  })

  const rows = (): AsnRow[] => {
    const d = data.latest
    if (!d) return []
    return [
      { label: 'ASN', value: `AS${d.asn}` },
      { label: 'Name', value: d.name },
      { label: 'Description', value: d.description },
      { label: 'Country', value: d.countryCode },
      { label: 'Prefixes', value: d.prefixes != null ? String(d.prefixes) : 'n/a' },
      { label: 'Peers', value: d.peers != null ? String(d.peers) : 'n/a' },
    ]
  }

  const submit = (e: Event) => {
    e.preventDefault()
    const parsed = Number.parseInt(draft().trim().replace(/^AS/i, ''), 10)
    if (Number.isFinite(parsed) && parsed > 0) setTarget(parsed)
  }

  return (
    <GlassSurface
      width="100%"
      height="100%"
      backgroundOpacity={0.2}
      borderRadius={20}
      class={`w-full ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    >
      <div class="flex h-full w-full flex-col gap-4 p-5 text-left">
        <form class="flex items-center gap-2" onSubmit={submit}>
          <input
            type="text"
            value={draft()}
            placeholder="AS number (e.g. 13335)"
            spellcheck={false}
            class="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm text-violet-200 outline-none placeholder:text-neutral-500 focus:border-violet-400/50"
            onInput={(e: Event) => setDraft((e.currentTarget as HTMLInputElement).value)}
          />
          <button
            type="submit"
            class="shrink-0 rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-400/20"
          >
            Lookup
          </button>
        </form>

        <Show
          when={!data.error}
          fallback={
            <p class="my-auto self-center font-mono text-sm text-rose-400">
              {data.error instanceof Error ? data.error.message : 'ASN lookup failed'}
            </p>
          }
        >
          <Show
            when={!data.loading}
            fallback={
              <div class="my-auto self-center font-mono text-sm text-violet-300/80">
                <TypingAnimation as="span" typeSpeed={45}>
                  {`tracing AS${target() ?? ''}…`}
                </TypingAnimation>
              </div>
            }
          >
            <dl class="flex flex-1 flex-col justify-center gap-2">
              <For each={rows()}>
                {row => (
                  <div class="flex items-baseline justify-between gap-4 border-b border-white/5 pb-1.5">
                    <dt class="shrink-0 text-xs tracking-widest text-neutral-400 uppercase">
                      {row.label}
                    </dt>
                    <dd class="truncate text-right font-mono text-sm text-neutral-100">
                      {row.value}
                    </dd>
                  </div>
                )}
              </For>
            </dl>
            <Show when={data()?.source === 'ripestat'}>
              <p class="text-[11px] text-neutral-500">via RIPEstat (BGPView unavailable)</p>
            </Show>
          </Show>
        </Show>
      </div>
    </GlassSurface>
  )
}

export default BgpAsnInfo
