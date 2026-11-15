// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: RIPEstat announced-prefixes (stat.ripe.net, no key, CORS-open).
import { createEffect, createResource, createSignal, onCleanup, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export interface AsnPrefixesProps {
  /** Initial ASN to inspect (e.g. 13335). */
  asn?: number
  /** Look up on mount (default true). */
  auto?: boolean
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface RipeAnnouncedPrefixes {
  data?: {
    prefixes?: Array<{ prefix?: string; timeline?: unknown }>
  }
}

const AsnPrefixes = (props: AsnPrefixesProps) => {
  const [target, setTarget] = createSignal(props.asn)
  const [draft, setDraft] = createSignal(props.asn != null ? String(props.asn) : '')
  const [filter, setFilter] = createSignal('')

  let controller: AbortController | null = null

  const lookup = async (asn: number, signal: AbortSignal): Promise<string[]> => {
    const response = await fetch(
      `https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS${asn}`,
      { signal },
    )
    const payload = (await response.json()) as RipeAnnouncedPrefixes
    if (!response.ok || !payload.data?.prefixes) throw new Error('announced-prefixes lookup failed')
    const prefixes = payload.data.prefixes
      .map(p => p.prefix ?? '')
      .filter(Boolean)
      .sort((a, b) => {
        const [aMajor] = a.split('/')
        const [bMajor] = b.split('/')
        const aIsV4 = !aMajor.includes(':')
        const bIsV4 = !bMajor.includes(':')
        return aIsV4 === bIsV4 ? a.localeCompare(b) : aIsV4 ? -1 : 1
      })
    if (prefixes.length === 0) throw new Error('this ASN announces no prefixes')
    return prefixes
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

  const filtered = (): string[] => {
    const all = data.latest ?? []
    const needle = filter().toLowerCase()
    if (!needle) return all
    return all.filter(p => p.toLowerCase().includes(needle))
  }

  const submit = (e: Event) => {
    e.preventDefault()
    const asn = Number.parseInt(draft().replace(/^AS/i, ''), 10)
    if (Number.isFinite(asn)) setTarget(asn)
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(filtered().join('\n'))
    } catch {
      /* clipboard denied: the list stays selectable */
    }
  }

  return (
    <div
      class={`flex h-full w-full flex-col gap-3 ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    >
      <form class="flex gap-2" onSubmit={submit}>
        <input
          type="text"
          value={draft()}
          onInput={e => setDraft(e.currentTarget.value)}
          placeholder="13335"
          spellcheck={false}
          class="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={data.loading}
          class="rounded border border-cyan-600/60 bg-cyan-600/20 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-600/30 disabled:opacity-50"
        >
          {data.loading ? '...' : 'Prefixes'}
        </button>
      </form>

      <Show when={data.error}>
        <p class="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 font-mono text-xs text-red-300">
          {(data.error as Error)?.message ?? 'lookup failed'}
        </p>
      </Show>

      <Show when={data.latest}>
        {prefixes => (
          <div class="flex min-h-0 flex-1 flex-col gap-2">
            <div class="flex items-center gap-2">
              <p class="flex-1 font-mono text-xs text-gray-400">
                AS{target()} announces <span class="text-gray-200">{prefixes().length}</span>{' '}
                prefixes (RIPEstat)
              </p>
              <button
                type="button"
                onClick={copyAll}
                class="rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
              >
                copy
              </button>
            </div>
            <input
              type="text"
              value={filter()}
              onInput={e => setFilter(e.currentTarget.value)}
              placeholder="filter prefixes..."
              spellcheck={false}
              class="rounded border border-gray-700 bg-gray-900 px-3 py-1.5 font-mono text-xs text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-500"
            />
            <div class="min-h-0 flex-1 overflow-y-auto pr-1">
              <For
                each={filtered()}
                fallback={
                  <p class="px-1 py-2 font-mono text-xs text-gray-500">
                    no prefixes match the filter
                  </p>
                }
              >
                {prefix => (
                  <p class="rounded px-1 py-1 font-mono text-xs text-gray-200 hover:bg-gray-800/60">
                    {prefix}
                  </p>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}

export default AsnPrefixes
