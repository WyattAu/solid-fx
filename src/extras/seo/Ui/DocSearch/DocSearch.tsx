// solid-fx SEO widget — original component (not a port). Free APIs: none (fetches the site's own search corpus emitted by docs-compiler).

import type { JSX } from 'solid-js'
import { createResource, createSignal, For, onMount, Show } from 'solid-js'

export interface DocSearchProps {
  /** URL of the search corpus (search.json emitted by docs-compiler). */
  indexUrl?: string
  /** URL of the docs_search.wasm reader module (wasm-first FST queries,
   * docs-search 0.3.1 ABI). Absent/unloadable = JSON corpus scoring. */
  wasmUrl?: string
  /** URL of the FST binary index (search.bin, reader input). */
  binUrl?: string
  /** Placeholder text (default "Search docs..."). */
  placeholder?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface CorpusEntry {
  title: string
  url: string
  description: string
  body: string
}

interface Scored {
  entry: CorpusEntry
  score: number
  snippet: string
}

// --- docs-search 0.3.1 reader ABI (wasm32-unknown-unknown; no WASI
// --- imports, so a plain browser instantiate works). Every failure
// --- resolves to null and the island keeps JSON scoring: fail-soft by
// --- design, never a broken search box.

interface DsIdxExports {
  memory: WebAssembly.Memory
  dsidx_alloc(len: number): number
  dsidx_free(ptr: number, len: number): void
  dsidx_open(ptr: number, len: number): number
  dsidx_query(
    handle: number,
    qptr: number,
    qlen: number,
    limit: number,
    outPtr: number,
    outCap: number,
  ): number
  dsidx_close(handle: number): void
}

interface Reader {
  ex: DsIdxExports
  handle: number
}

async function loadReader(wasmUrl: string, binUrl: string): Promise<Reader> {
  const instance = (await WebAssembly.instantiateStreaming(fetch(wasmUrl))).instance
  const ex = instance.exports as unknown as DsIdxExports
  const bytes = new Uint8Array(await (await fetch(binUrl)).arrayBuffer())
  const ptr = ex.dsidx_alloc(bytes.length)
  // Views are created AFTER alloc: a growing memory detaches old buffers.
  new Uint8Array(ex.memory.buffer, ptr, bytes.length).set(bytes)
  const handle = ex.dsidx_open(ptr, bytes.length)
  // dsidx_open copies into wasm-owned memory; the host alloc is spent.
  ex.dsidx_free(ptr, bytes.length)
  if (handle === 0) throw new Error('malformed index bytes')
  return { ex, handle }
}

function readerQuery(
  reader: Reader,
  query: string,
  limit: number,
): Array<{ doc: number; score: number }> {
  const { ex, handle } = reader
  const q = new TextEncoder().encode(query)
  const qptr = ex.dsidx_alloc(q.length)
  new Uint8Array(ex.memory.buffer, qptr, q.length).set(q)
  let cap = 4096
  let outPtr = ex.dsidx_alloc(cap)
  let written = ex.dsidx_query(handle, qptr, q.length, limit, outPtr, cap)
  // written === cap means the JSON likely truncated (the ABI writes a
  // partial prefix and returns the length); grow once and retry. Still
  // capped = the hit list genuinely does not fit, give up on wasm.
  if (written >= cap) {
    ex.dsidx_free(outPtr, cap)
    cap = 65536
    outPtr = ex.dsidx_alloc(cap)
    written = ex.dsidx_query(handle, qptr, q.length, limit, outPtr, cap)
  }
  ex.dsidx_free(qptr, q.length)
  let hits: Array<{ doc: number; score: number }> = []
  if (written > 0 && written < cap) {
    try {
      const json = new TextDecoder().decode(new Uint8Array(ex.memory.buffer, outPtr, written))
      hits = JSON.parse(json) as Array<{ doc: number; score: number }>
    } catch {
      hits = []
    }
  }
  ex.dsidx_free(outPtr, cap)
  return hits
}

const DocSearch = (props: DocSearchProps) => {
  const [query, setQuery] = createSignal('')
  const [open, setOpen] = createSignal(false)
  const [reader, setReader] = createSignal<Reader | null>(null)
  const [readerFailed, setReaderFailed] = createSignal(false)

  const [corpus] = createResource(
    () => props.indexUrl ?? '/search.json',
    async url => {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`corpus HTTP ${response.status}`)
      return (await response.json()) as CorpusEntry[]
    },
  )

  // Lazy reader init: when both URLs are wired, load the module + FST
  // binary once. Any failure flips readerFailed and JSON scoring keeps
  // running — no retry loop, no broken search box.
  onMount(() => {
    const wasm = props.wasmUrl
    const bin = props.binUrl
    if (!wasm || !bin) return
    loadReader(wasm, bin)
      .then(setReader)
      .catch(() => setReaderFailed(true))
  })

  const score = (entry: CorpusEntry, terms: string[]): Scored | null => {
    const title = entry.title.toLowerCase()
    const description = entry.description.toLowerCase()
    const body = entry.body.toLowerCase()
    let total = 0
    let matchedAll = true
    for (const term of terms) {
      if (title.includes(term)) total += 10
      else if (description.includes(term)) total += 4
      else if (body.includes(term)) total += 1
      else matchedAll = false
    }
    if (!matchedAll || total === 0) return null
    const bodyPos = body.indexOf(terms[0])
    const snippet =
      bodyPos >= 0
        ? `${bodyPos > 40 ? '...' : ''}${body.slice(Math.max(0, bodyPos - 40), bodyPos + 120)}...`
        : description
    return { entry, score: total, snippet }
  }

  // BM25 through the wasm reader when it loaded; doc ids index the
  // corpus array (the compiler emits ids in corpus order). Any error
  // in this path degrades to the JSON scorer below.
  const wasmResults = (): Scored[] | null => {
    const active = reader()
    if (!active || readerFailed()) return null
    const entries = corpus()
    if (!entries) return null
    try {
      return readerQuery(active, query().trim(), 8)
        .map(hit => {
          const entry = entries[hit.doc]
          if (!entry) return null
          const snippet =
            entry.body.length > 120
              ? `${entry.body.slice(0, 120)}...`
              : entry.body || entry.description
          return { entry, score: hit.score, snippet }
        })
        .filter((s): s is Scored => s !== null)
    } catch {
      setReaderFailed(true)
      return null
    }
  }

  const results = (): Scored[] => {
    const terms = query().toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return []
    if (terms.length > 0 && query().trim()) {
      const viaWasm = wasmResults()
      if (viaWasm !== null) return viaWasm
    }
    if (!corpus()) return []
    return (corpus() ?? [])
      .map(entry => score(entry, terms))
      .filter((s): s is Scored => s !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }

  const submit = (e: Event) => {
    e.preventDefault()
    const first = results()[0]
    if (first) window.location.href = first.entry.url
  }

  return (
    <div class={`relative ${props.class ?? ''} ${props.className ?? ''}`} style={props.style}>
      <form onSubmit={submit}>
        <input
          type="search"
          value={query()}
          onInput={e => {
            setQuery(e.currentTarget.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={props.placeholder ?? 'Search docs...'}
          autocomplete="off"
          class="w-48 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-500 focus:w-64 transition-all"
        />
      </form>
      <Show when={open() && query().trim() && results().length > 0}>
        <div class="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-gray-700 bg-gray-950 p-2 shadow-xl">
          <For each={results()}>
            {scored => (
              <a
                href={scored.entry.url}
                class="block rounded px-3 py-2 hover:bg-gray-800"
                onMouseDown={e => e.preventDefault()}
              >
                <p class="text-sm font-medium text-cyan-300">{scored.entry.title}</p>
                <p class="mt-0.5 line-clamp-2 text-xs text-gray-400">{scored.snippet}</p>
              </a>
            )}
          </For>
          <p class="px-3 pb-1 pt-2 font-mono text-xs text-gray-600">
            {results().length} result(s) - client-side, zero server
          </p>
        </div>
      </Show>
      <Show when={open() && query().trim() && results().length === 0 && !corpus.loading}>
        <div class="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-400 shadow-xl">
          no results for "{query()}"
        </div>
      </Show>
    </div>
  )
}

export default DocSearch
