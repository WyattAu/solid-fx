// solid-fx OSINT widget — original component (not a port). Free OSINT API: archive.org availability (archive.org/wayback/available, no key, CORS-open). The CDX endpoint has no CORS header, so the browser probes year-by-year instead.

import type { JSX } from 'solid-js'
import { createEffect, createResource, createSignal, For, onCleanup, Show } from 'solid-js'

export interface WaybackTimelineProps {
  /** Initial URL to inspect (e.g. example.com). */
  url?: string
  /** Look up on mount (default true). */
  auto?: boolean
  /** Years probed back from the current year (default 20). */
  limit?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface AvailabilityResponse {
  archived_snapshots?: {
    closest?: {
      status?: string
      available?: boolean
      url?: string
      timestamp?: string
    }
  }
}

interface YearCapture {
  year: string
  /** Full replay URL as returned by the availability API. */
  replay: string
  /** Snapshot timestamp (14 digits). */
  timestamp: string
  status: string
}

interface Timeline {
  url: string
  captures: YearCapture[]
  probed: number
}

const WaybackTimeline = (props: WaybackTimelineProps) => {
  const [target, setTarget] = createSignal(props.url)
  const [draft, setDraft] = createSignal(props.url ?? '')

  let controller: AbortController | null = null

  const timeline = async (url: string, signal: AbortSignal): Promise<Timeline> => {
    const years: number[] = []
    const current = new Date().getFullYear()
    for (let y = current; y > current - (props.limit ?? 20); y -= 1) years.push(y)

    const results = await Promise.allSettled(
      years.map(year =>
        fetch(
          `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=${year}0101`,
          { signal },
        ).then(r => {
          if (!r.ok) throw new Error(`availability returned HTTP ${r.status}`)
          return r.json() as Promise<AvailabilityResponse>
        }),
      ),
    )
    if (signal.aborted) throw new Error('aborted')

    const captures: YearCapture[] = []
    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      const closest = result.value.archived_snapshots?.closest
      if (closest?.available && closest.url && closest.timestamp) {
        const ts = closest.timestamp
        captures.push({
          year: ts.slice(0, 4),
          replay: closest.url,
          timestamp: ts,
          status: closest.status ?? '',
        })
      }
    }
    // Deduplicate years (the availability probe can answer outside its
    // probed year when no capture exists near the hint).
    const seen = new Set<string>()
    const unique = captures.filter(c => (seen.has(c.year) ? false : seen.add(c.year)))
    unique.sort((a, b) => a.year.localeCompare(b.year))
    if (unique.length === 0) throw new Error('no captures found for this URL')
    return { url, captures: unique, probed: years.length }
  }

  const [data] = createResource(target, url => {
    controller?.abort()
    controller = new AbortController()
    return timeline(url, controller.signal)
  })

  onCleanup(() => controller?.abort())

  createEffect(() => {
    if (props.url !== undefined && props.url !== target()) setTarget(props.url)
  })

  const submit = (e: Event) => {
    e.preventDefault()
    const clean = draft()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
    if (clean) setTarget(clean)
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
          placeholder="example.com"
          spellcheck={false}
          class="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={data.loading}
          class="rounded border border-cyan-600/60 bg-cyan-600/20 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-600/30 disabled:opacity-50"
        >
          {data.loading ? '...' : 'Timeline'}
        </button>
      </form>

      <Show
        when={data.error}
        fallback={
          <Show when={data.loading}>
            <p class="font-mono text-xs text-gray-400">probing archive.org year by year...</p>
          </Show>
        }
      >
        <p class="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 font-mono text-xs text-red-300">
          {(data.error as Error)?.message ?? 'lookup failed'}
        </p>
      </Show>

      <Show when={data.latest}>
        {timelineData => (
          <div class="flex min-h-0 flex-1 flex-col gap-2">
            <p class="font-mono text-xs text-gray-400">
              {timelineData().captures.length}/{timelineData().probed} years with captures for{' '}
              <span class="text-gray-200">{timelineData().url}</span>, via archive.org
            </p>
            <div class="min-h-0 flex-1 overflow-y-auto pr-1">
              <For each={timelineData().captures}>
                {capture => (
                  <a
                    href={capture.replay}
                    target="_blank"
                    rel="noreferrer"
                    class="group flex items-center gap-2 rounded px-1 py-1.5 hover:bg-gray-800/60"
                  >
                    <span class="w-10 shrink-0 font-mono text-xs text-gray-400 group-hover:text-cyan-300">
                      {capture.year}
                    </span>
                    <span class="h-3 w-3 rounded-full bg-cyan-600/70 group-hover:bg-cyan-400" />
                    <span class="shrink-0 font-mono text-xs text-gray-300">
                      {capture.timestamp.slice(4, 8).replace(/(\d{2})(\d{2})/, '$1-$2')} ·{' '}
                      {capture.status}
                    </span>
                  </a>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}

export default WaybackTimeline
