// solid-fx SEO widget — original component (not a port). Free APIs: native fetch of any public sitemap.xml (no key).
import { createEffect, createMemo, createSignal, onCleanup, splitProps, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export type SitemapVizStatus = 'idle' | 'loading' | 'error' | 'ok'

export interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

export interface SitemapVizProps {
  /** sitemap.xml URL. @default `<origin>/sitemap.xml` */
  url?: string
  /** Fetch on mount and whenever `url` changes. @default true */
  auto?: boolean
  /** Raw sitemap XML; when provided, no fetch happens (offline/docs use). */
  xml?: string
  class?: string
  /** Solid class alias, merged alongside `class`. */
  className?: string
}

const CHANGEFREQ_COLORS: Record<string, string> = {
  always: '#22d3ee',
  hourly: '#38bdf8',
  daily: '#34d399',
  weekly: '#a3e635',
  monthly: '#fbbf24',
  yearly: '#fb923c',
  never: '#ff6b7a',
}

function textOf(el: Element | null): string | undefined {
  const t = el?.textContent?.trim()
  return t || undefined
}

function parseSitemap(xml: string): { entries: SitemapEntry[]; kind: 'urlset' | 'sitemapindex' } {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid sitemap XML')

  const pick = (name: string, root: Document | Element): Element | null =>
    root.getElementsByTagName(name)[0] ?? null

  const urlNodes = Array.from(doc.getElementsByTagName('url'))
  if (urlNodes.length > 0) {
    return {
      kind: 'urlset',
      entries: urlNodes.map(n => ({
        loc: textOf(pick('loc', n)) ?? '',
        lastmod: textOf(pick('lastmod', n)),
        changefreq: textOf(pick('changefreq', n)),
        priority: textOf(pick('priority', n)),
      })),
    }
  }

  const sitemapNodes = Array.from(doc.getElementsByTagName('sitemap'))
  return {
    kind: 'sitemapindex',
    entries: sitemapNodes.map(n => ({
      loc: textOf(pick('loc', n)) ?? '',
      lastmod: textOf(pick('lastmod', n)),
    })),
  }
}

function prettyPath(loc: string): { host: string; path: string } {
  try {
    const u = new URL(loc)
    return { host: u.host, path: u.pathname === '/' ? '/' : u.pathname + u.search }
  } catch {
    return { host: loc, path: '' }
  }
}

function EntryRow(props: { entry: SitemapEntry; index: number }) {
  const pretty = createMemo(() => prettyPath(props.entry.loc))
  const freqColor = () =>
    (props.entry.changefreq && CHANGEFREQ_COLORS[props.entry.changefreq.toLowerCase()]) || '#a1a1aa'
  return (
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/5 px-3 py-2 font-mono text-xs last:border-b-0 hover:bg-white/5">
      <span class="w-8 shrink-0 text-zinc-600">{String(props.index + 1).padStart(2, '0')}</span>
      <div class="min-w-0 flex-1">
        <div class="truncate text-zinc-500">{pretty().host}</div>
        <div class="break-all text-zinc-200">{pretty().path}</div>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-1.5">
        <Show when={props.entry.lastmod}>
          {lm => (
            <span class="text-zinc-500" title="Last modified">
              {lm().slice(0, 10)}
            </span>
          )}
        </Show>
        <Show when={props.entry.changefreq}>
          <span
            class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ color: freqColor(), 'background-color': `${freqColor()}1f` }}
            title="Change frequency"
          >
            {props.entry.changefreq}
          </span>
        </Show>
        <Show when={props.entry.priority}>
          <span
            class="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300"
            title="Priority"
          >
            p {props.entry.priority}
          </span>
        </Show>
      </div>
    </div>
  )
}

/**
 * Fetches a sitemap.xml (regular urlset or a sitemap index) and renders its
 * URLs with lastmod / changefreq / priority metadata. With `auto={false}` the
 * widget starts idle and fetches only via the Refresh button; pass `xml`
 * for offline use.
 */
export default function SitemapViz(props: SitemapVizProps): JSX.Element {
  const [own, rest] = splitProps(props, ['url', 'auto', 'xml', 'class', 'className'])

  const defaultUrl = () =>
    typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : '/sitemap.xml'

  const [xmlText, setXmlText] = createSignal<string | null>(null)
  const [status, setStatus] = createSignal<SitemapVizStatus>('idle')
  const [error, setError] = createSignal('')
  const [tick, setTick] = createSignal(0)

  let controller: AbortController | null = null

  const load = async () => {
    if (typeof own.xml === 'string') {
      setXmlText(own.xml)
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
        headers: { Accept: 'application/xml, text/xml' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      setXmlText(await res.text())
      setStatus('ok')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  createEffect(() => {
    void own.url
    void own.xml
    const t = tick()
    const auto = own.auto ?? true
    // auto={false} starts idle; the Refresh button (tick > 0) triggers a fetch.
    if (!auto && t === 0) return
    void load()
  })
  onCleanup(() => controller?.abort())

  /** Manually (re)fetch the sitemap. */
  const refetch = () => setTick(tick() + 1)

  const parsed = createMemo(() => {
    if (!xmlText()) return null
    try {
      return parseSitemap(xmlText()!)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
      return null
    }
  })
  const shownUrl = () => own.url ?? defaultUrl()

  const statusColor = () =>
    status() === 'ok' ? '#34d399' : status() === 'error' ? '#ff6b7a' : '#a1a1aa'

  return (
    <div
      class={`w-full ${own.class ?? ''} ${own.className ?? ''}`.trim()}
      {...rest}
      aria-label="sitemap.xml visualization"
    >
      <div class="rounded-xl border border-white/10 bg-zinc-900/60 p-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
              sitemap.xml
            </div>
            <div class="truncate font-mono text-xs text-zinc-400">{shownUrl()}</div>
          </div>
          <div class="flex items-center gap-2">
            <Show when={parsed()}>
              {p => (
                <span class="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                  {p().kind === 'urlset'
                    ? `${p().entries.length} URLs`
                    : `${p().entries.length} sitemaps`}
                </span>
              )}
            </Show>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ color: statusColor(), 'background-color': `${statusColor()}1f` }}
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
              Failed to load sitemap — {error()}
            </div>
          }
        >
          <Show
            when={status() !== 'loading'}
            fallback={
              <div class="space-y-2" aria-hidden="true">
                <For each={[1, 2, 3, 4]}>
                  {() => <div class="h-8 w-full animate-pulse rounded bg-white/5" />}
                </For>
              </div>
            }
          >
            <Show
              when={parsed()}
              fallback={<div class="text-sm text-zinc-500">No sitemap content parsed.</div>}
            >
              {p => (
                <div class="overflow-hidden rounded-lg border border-white/10">
                  <div class="flex flex-col">
                    <For each={p().entries}>
                      {(entry, i) => <EntryRow entry={entry} index={i()} />}
                    </For>
                    <Show when={p().entries.length === 0}>
                      <div class="px-3 py-3 text-xs text-zinc-600">Empty sitemap.</div>
                    </Show>
                  </div>
                </div>
              )}
            </Show>
          </Show>
        </Show>
      </div>
    </div>
  )
}
