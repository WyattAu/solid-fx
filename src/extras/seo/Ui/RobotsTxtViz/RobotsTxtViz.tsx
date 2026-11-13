// solid-fx SEO widget — original component (not a port). Free APIs: native fetch of any public robots.txt (no key).
import { createEffect, createMemo, createSignal, onCleanup, splitProps, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export type RobotsTxtStatus = 'idle' | 'loading' | 'error' | 'ok'

export interface RobotsGroup {
  /** All user-agent tokens that share this rule block. */
  agents: string[]
  allow: string[]
  disallow: string[]
  sitemaps: string[]
  crawlDelay?: string
}

export interface RobotsTxtVizProps {
  /** robots.txt URL. @default `<origin>/robots.txt` */
  url?: string
  /** Fetch on mount and whenever `url` changes. @default true */
  auto?: boolean
  /** Raw robots.txt content; when provided, no fetch happens (offline/docs use). */
  text?: string
  class?: string
  /** Solid class alias, merged alongside `class`. */
  className?: string
}

const DEFAULT_USER_AGENT = '*'

function parseRobots(source: string): RobotsGroup[] {
  const groups: RobotsGroup[] = []
  let current: RobotsGroup | null = null
  const sitemaps: string[] = []

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue
    const sep = line.indexOf(':')
    if (sep === -1) continue
    const field = line.slice(0, sep).trim().toLowerCase()
    const value = line.slice(sep + 1).trim()

    if (field === 'user-agent') {
      // Consecutive user-agent lines share one rule block (robots.txt spec).
      if (
        current &&
        current.allow.length === 0 &&
        current.disallow.length === 0 &&
        !current.crawlDelay
      ) {
        if (!current.agents.includes(value)) current.agents.push(value)
        continue
      }
      // Agent re-appearing later in the file reuses its existing block.
      const existing = groups.find(g => g.agents.includes(value))
      if (existing) {
        current = existing
        continue
      }
      current = { agents: [value], allow: [], disallow: [], sitemaps: [] }
      groups.push(current)
    } else {
      if (!current) {
        current = { agents: [], allow: [], disallow: [], sitemaps: [] }
        groups.push(current)
      }
      if (field === 'allow') {
        current.allow.push(value || '(empty)')
      } else if (field === 'disallow') {
        current.disallow.push(value === '' ? '(allow all)' : value)
      } else if (field === 'crawl-delay') {
        current.crawlDelay = value
      } else if (field === 'sitemap') {
        sitemaps.push(value)
      }
    }
  }

  // File-level sitemap directives apply to every crawler group.
  for (const g of groups) g.sitemaps.push(...sitemaps)

  return groups
}

function GroupTable(props: { group: RobotsGroup }) {
  const rows = createMemo(() => {
    const rows: { field: string; value: string }[] = []
    for (const a of props.group.disallow) rows.push({ field: 'Disallow', value: a })
    for (const a of props.group.allow) rows.push({ field: 'Allow', value: a })
    if (props.group.crawlDelay) rows.push({ field: 'Crawl-delay', value: props.group.crawlDelay })
    return rows
  })
  return (
    <div class="overflow-hidden rounded-lg border border-white/10">
      <div class="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2">
        <span class="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          User-agent
        </span>
        <For each={props.group.agents}>
          {a => (
            <span class="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
              {a}
            </span>
          )}
        </For>
        <Show when={props.group.crawlDelay}>
          {delay => (
            <span class="ml-auto font-mono text-[10px] text-zinc-500">delay: {delay()}s</span>
          )}
        </Show>
      </div>
      <table class="w-full font-mono text-xs">
        <tbody>
          <For each={rows()}>
            {r => (
              <tr class="border-b border-white/5 last:border-b-0">
                <td
                  class="w-24 px-3 py-1.5 align-top font-medium"
                  style={{ color: r.field === 'Disallow' ? '#ff6b7a' : '#34d399' }}
                >
                  {r.field}:
                </td>
                <td class="px-3 py-1.5 break-all text-zinc-300">{r.value}</td>
              </tr>
            )}
          </For>
          <Show when={rows().length === 0}>
            <tr>
              <td class="px-3 py-1.5 text-zinc-600" colSpan={2}>
                no rules
              </td>
            </tr>
          </Show>
        </tbody>
      </table>
      <Show when={props.group.sitemaps.length > 0}>
        <div class="border-t border-white/10 px-3 py-2">
          <div class="mb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            Sitemap
          </div>
          <For each={props.group.sitemaps}>
            {s => <div class="break-all font-mono text-xs text-amber-300/90">{s}</div>}
          </For>
        </div>
      </Show>
    </div>
  )
}

/**
 * Fetches a robots.txt and renders its rule groups (user-agent, allow,
 * disallow, crawl-delay, sitemap) as a styled table. With `auto={false}` the
 * widget starts idle and fetches only via the Refresh button; pass `text`
 * for offline use.
 */
export default function RobotsTxtViz(props: RobotsTxtVizProps): JSX.Element {
  const [own, rest] = splitProps(props, ['url', 'auto', 'text', 'class', 'className'])

  const defaultUrl = () =>
    typeof window !== 'undefined' ? `${window.location.origin}/robots.txt` : '/robots.txt'

  const [source, setSource] = createSignal<string | null>(null)
  const [status, setStatus] = createSignal<RobotsTxtStatus>('idle')
  const [error, setError] = createSignal('')
  const [tick, setTick] = createSignal(0)

  let controller: AbortController | null = null

  const load = async () => {
    if (typeof own.text === 'string') {
      setSource(own.text)
      setStatus('ok')
      return
    }
    controller?.abort()
    controller = new AbortController()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch(own.url ?? defaultUrl(), {
        signal: controller.signal,
        headers: { Accept: 'text/plain' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      setSource(await res.text())
      setStatus('ok')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  createEffect(() => {
    void own.url
    void own.text
    const t = tick()
    const auto = own.auto ?? true
    // auto={false} starts idle; the Refresh button (tick > 0) triggers a fetch.
    if (!auto && t === 0) return
    void load()
  })
  onCleanup(() => controller?.abort())

  /** Manually (re)fetch the robots.txt. */
  const refetch = () => setTick(tick() + 1)

  const groups = createMemo(() => (source() ? parseRobots(source()!) : []))
  const shownUrl = () => own.url ?? defaultUrl()

  const panel = `rounded-xl border border-white/10 bg-zinc-900/60 p-5`

  return (
    <div
      class={`w-full ${own.class ?? ''} ${own.className ?? ''}`.trim()}
      {...rest}
      aria-label="robots.txt visualization"
    >
      <div class={panel}>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
              robots.txt
            </div>
            <div class="truncate font-mono text-xs text-zinc-400">{shownUrl()}</div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                color: status() === 'ok' ? '#34d399' : status() === 'error' ? '#ff6b7a' : '#a1a1aa',
                'background-color':
                  status() === 'ok'
                    ? '#34d3991f'
                    : status() === 'error'
                      ? '#ff6b7a1f'
                      : '#a1a1aa1f',
              }}
            >
              {status() === 'loading' ? 'fetching…' : status()}
            </span>
            <button
              type="button"
              class="rounded bg-white/10 px-2.5 py-1 text-xs text-zinc-200 hover:bg-white/20"
              onClick={refetch}
            >
              Refresh
            </button>
          </div>
        </div>

        <Show
          when={status() !== 'error'}
          fallback={
            <div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              Failed to load robots.txt — {error()}
            </div>
          }
        >
          <Show
            when={status() !== 'loading'}
            fallback={
              <div class="space-y-2" aria-hidden="true">
                <div class="h-8 w-40 animate-pulse rounded bg-white/10" />
                <div class="h-24 w-full animate-pulse rounded bg-white/5" />
              </div>
            }
          >
            <Show
              when={groups().length > 0}
              fallback={<div class="text-sm text-zinc-500">No groups parsed from robots.txt.</div>}
            >
              <div class="flex flex-col gap-4">
                <For each={groups()}>{g => <GroupTable group={g} />}</For>
              </div>
            </Show>
          </Show>
        </Show>
      </div>
    </div>
  )
}
