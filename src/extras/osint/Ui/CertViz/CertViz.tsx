// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: crt.sh certificate transparency log search (no key).
import { createEffect, createResource, createSignal, onCleanup, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import TypingAnimation from '@/extras/magic-ui/Ui/TypingAnimation/TypingAnimation'

export interface CertVizProps {
  /** Domain to search in certificate transparency logs. */
  domain: string
  /** Look up on mount (default true). */
  auto?: boolean
  /** Max rows rendered before "+N more" (default 8). */
  limit?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface CrtShEntry {
  issuer_ca_id?: number
  issuer_name?: string
  common_name?: string
  name_value?: string
  entry_timestamp?: string
  not_before?: string
  not_after?: string
  id?: number
}

interface CertRow {
  id: number
  commonName: string
  issuer: string
  notBefore: string
  notAfter: string
  entryTimestamp: string
  sanCount: number
}

// crt.sh can take 10-40s on busy domains; give it room but always bail.
const TIMEOUT_MS = 45_000

const cn = (issuerName: string | undefined): string => {
  const match = /(?:^|,\s*)CN=([^,]+)/.exec(issuerName ?? '')
  return match?.[1] ?? issuerName ?? '—'
}

const day = (iso: string | undefined): string => (iso ? iso.slice(0, 10) : '—')

const CertViz = (props: CertVizProps) => {
  const [draft, setDraft] = createSignal(props.domain ?? '')
  const [domain, setDomain] = createSignal(props.domain ?? '')
  const [expanded, setExpanded] = createSignal(false)

  let controller: AbortController | null = null

  const lookup = async (host: string, signal: AbortSignal): Promise<CertRow[]> => {
    if (!host) return []
    const timer = setTimeout(() => controller?.abort(), TIMEOUT_MS)
    try {
      const url = `https://crt.sh/?q=${encodeURIComponent(host)}&output=json`
      const response = await fetch(url, { signal })
      if (!response.ok) throw new Error(`crt.sh returned HTTP ${response.status}`)
      const entries = (await response.json()) as CrtShEntry[]
      if (!Array.isArray(entries)) throw new Error('Unexpected crt.sh response shape')
      const seen = new Set<number>()
      const rows = entries
        .filter(entry => {
          const id = entry.id ?? 0
          if (seen.has(id)) return false
          seen.add(id)
          return true
        })
        .map<CertRow>(entry => ({
          id: entry.id ?? 0,
          commonName: entry.common_name ?? '—',
          issuer: cn(entry.issuer_name),
          notBefore: day(entry.not_before),
          notAfter: day(entry.not_after),
          entryTimestamp: day(entry.entry_timestamp),
          sanCount: (entry.name_value ?? '')
            .split(/\n/)
            .map(n => n.trim())
            .filter(Boolean).length,
        }))
        .sort((a, b) => b.entryTimestamp.localeCompare(a.entryTimestamp))
      return rows
    } finally {
      clearTimeout(timer)
    }
  }

  const [rows] = createResource(domain, host => {
    controller?.abort()
    controller = new AbortController()
    return lookup(host, controller.signal)
  })

  onCleanup(() => {
    controller?.abort()
  })

  createEffect(() => {
    if (props.domain !== undefined && props.domain !== domain()) {
      setDomain(props.domain)
      setDraft(props.domain)
      setExpanded(false)
    }
  })

  const submit = (e: Event) => {
    e.preventDefault()
    const host = draft()
      .trim()
      .replace(/^\*\./, '')
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
    setDraft(host)
    setDomain(host)
    setExpanded(false)
  }

  const error = () => {
    const err = rows.error
    if (err instanceof DOMException && err.name === 'AbortError')
      return 'crt.sh timed out — try again'
    return err instanceof Error ? err.message : 'CT log query failed'
  }

  const visible = () => (expanded() ? rows.latest : rows.latest?.slice(0, props.limit ?? 8))
  const hiddenCount = () => (rows.latest?.length ?? 0) - (visible()?.length ?? 0)

  return (
    <div
      class={`flex h-full w-full flex-col gap-3 text-left ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    >
      <form class="flex items-center gap-2" onSubmit={submit}>
        <input
          type="text"
          value={draft()}
          placeholder="domain.tld"
          spellcheck={false}
          class="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm text-teal-200 outline-none placeholder:text-neutral-500 focus:border-teal-400/50"
          onInput={(e: Event) => setDraft((e.currentTarget as HTMLInputElement).value)}
        />
        <button
          type="submit"
          class="shrink-0 rounded-lg border border-teal-400/30 bg-teal-400/10 px-3 py-1.5 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-400/20"
        >
          Certs
        </button>
      </form>

      <Show
        when={!rows.error}
        fallback={<p class="my-auto self-center font-mono text-sm text-rose-400">{error()}</p>}
      >
        <Show
          when={!rows.loading}
          fallback={
            <div class="my-auto flex flex-col items-center gap-1 font-mono text-sm text-teal-300/80">
              <TypingAnimation as="span" typeSpeed={45}>
                {`searching CT logs for ${domain()}…`}
              </TypingAnimation>
              <span class="text-[11px] text-neutral-500">
                crt.sh can take up to 45s on large domains
              </span>
            </div>
          }
        >
          <Show
            when={(rows.latest?.length ?? 0) > 0}
            fallback={
              <p class="my-auto self-center font-mono text-sm text-neutral-400">
                No certificates logged for {domain()}
              </p>
            }
          >
            <div class="min-h-0 flex-1 space-y-1.5 overflow-auto pr-1">
              <For each={visible()}>
                {row => (
                  <div class="flex items-baseline justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 transition-colors hover:border-teal-400/30 hover:bg-teal-400/5">
                    <div class="flex min-w-0 flex-col">
                      <span class="truncate font-mono text-sm text-neutral-100">
                        {row.commonName}
                      </span>
                      <span class="truncate text-[11px] text-neutral-500">
                        {row.issuer} · {row.sanCount} SANs
                      </span>
                    </div>
                    <div class="flex shrink-0 flex-col items-end font-mono text-[11px] text-neutral-400">
                      <span>
                        {row.notBefore} → {row.notAfter}
                      </span>
                      <span class="text-neutral-600">logged {row.entryTimestamp}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
            <div class="flex shrink-0 items-center justify-between text-[11px] text-neutral-500">
              <span>{rows.latest?.length} certs · certificate transparency (crt.sh)</span>
              <Show
                when={hiddenCount() > 0}
                fallback={
                  <button
                    type="button"
                    class="text-neutral-400 underline-offset-2 hover:text-teal-300 hover:underline"
                    onClick={() => setExpanded(false)}
                  >
                    collapse
                  </button>
                }
              >
                <button
                  type="button"
                  class="text-neutral-400 underline-offset-2 hover:text-teal-300 hover:underline"
                  onClick={() => setExpanded(true)}
                >
                  +{hiddenCount()} more
                </button>
              </Show>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default CertViz
