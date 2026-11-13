// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: ipwho.is (IP geolocation, no key).
import { createEffect, createResource, createSignal, onCleanup, onMount, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import GlassSurface from '@/content/Components/GlassSurface/GlassSurface'
import TypingAnimation from '@/extras/magic-ui/Ui/TypingAnimation/TypingAnimation'

export interface IpLookupProps {
  /** IP to look up; empty = auto-detect the caller's IP via ipwho.is. */
  ip?: string
  /** Look up on mount (default true). */
  auto?: boolean
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface IpWhoIsResponse {
  ip?: string
  success?: boolean
  message?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  postal?: string
  flag?: { emoji?: string }
  connection?: { asn?: number; org?: string; isp?: string; domain?: string }
  timezone?: { id?: string; utc?: string; abbr?: string }
}

interface IpRow {
  label: string
  value: string
}

const IpLookup = (props: IpLookupProps) => {
  // The query target; '' means "look up the caller's own IP".
  const [target, setTarget] = createSignal(props.ip ?? '')
  const [draft, setDraft] = createSignal(props.ip ?? '')

  let controller: AbortController | null = null

  const lookup = async (query: string, signal: AbortSignal): Promise<IpWhoIsResponse> => {
    const url = query ? `https://ipwho.is/${encodeURIComponent(query)}` : 'https://ipwho.is/'
    const response = await fetch(url, { signal })
    const data = (await response.json()) as IpWhoIsResponse
    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Lookup failed (HTTP ${response.status})`)
    }
    return data
  }

  const [data] = createResource(target, query => {
    controller?.abort()
    controller = new AbortController()
    return lookup(query, controller.signal)
  })

  onMount(() => {
    if (props.auto ?? true) setTarget(draft() || '')
  })

  onCleanup(() => controller?.abort())

  // Re-query when the caller changes the `ip` prop.
  createEffect(() => {
    const next = props.ip
    if (next !== undefined && next !== target()) setTarget(next)
  })

  const rows = (): IpRow[] => {
    const d = data.latest
    if (!d) return []
    const connection = d.connection ?? {}
    const timezone = d.timezone ?? {}
    return [
      { label: 'IP', value: d.ip ?? '—' },
      {
        label: 'Country',
        value:
          `${d.flag?.emoji ?? ''} ${d.country ?? '—'}${d.country_code ? ` (${d.country_code})` : ''}`.trim(),
      },
      {
        label: 'City',
        value: [d.city, d.region, d.postal].filter(Boolean).join(', ') || '—',
      },
      { label: 'ISP', value: connection.isp ?? connection.org ?? '—' },
      { label: 'ASN', value: connection.asn != null ? `AS${connection.asn}` : '—' },
      {
        label: 'Timezone',
        value: [timezone.id, timezone.utc].filter(Boolean).join(' ') || '—',
      },
    ]
  }

  const submit = (e: Event) => {
    e.preventDefault()
    setTarget(draft().trim())
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
            placeholder="IP address (blank = yours)"
            spellcheck={false}
            class="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm text-emerald-200 outline-none placeholder:text-neutral-500 focus:border-emerald-400/50"
            onInput={(e: Event) => setDraft((e.currentTarget as HTMLInputElement).value)}
          />
          <button
            type="submit"
            class="shrink-0 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-400/20"
          >
            Resolve
          </button>
        </form>

        <Show
          when={!data.error}
          fallback={
            <p class="my-auto self-center font-mono text-sm text-rose-400">
              {data.error?.message ?? 'Lookup failed'}
            </p>
          }
        >
          <Show
            when={!data.loading}
            fallback={
              <div class="my-auto self-center font-mono text-sm text-emerald-300/80">
                <TypingAnimation as="span" typeSpeed={45}>
                  {`querying ipwho.is…`}
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
          </Show>
        </Show>
      </div>
    </GlassSurface>
  )
}

export default IpLookup
