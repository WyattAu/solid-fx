// solid-fx SEO widget — original component (not a port). Free APIs: none (fetches the site's own search corpus emitted by docs-compiler).
import { onMount, createResource, createSignal, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export interface DocSearchProps {
  /** URL of the search corpus (search.json emitted by docs-compiler). */
  indexUrl?: string
  /** URL of the docs_search.wasm reader (FST query, docs-search 0.3+). */
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

/** The docs-search reader ABI (docs-search 0.3+, src/wasm.rs). */
interface WasmExports {
  memory: WebAssembly.Memory
  dsidx_alloc: (len: number) => number
  dsidx_free: (ptr: number, len: number) => void
  dsidx_open: (ptr: number, len: number) => number
  dsidx_close: (handle: number) => void
  dsidx_query: (
    handle: number,
    qptr: number,
    qlen: number,
    limit: number,
    outPtr: number,
    outCap: number,
  ) => number
}

interface WasmReader {
  exports: WasmExports
  handle: number
  memory: WebAssembly.Memory
}

/** Load docs_search.wasm + search.bin and open the index. Throws on
 * any failure — callers fall back to JSON scoring. */
async function loadReader(wasmUrl: string, binUrl: string): Promise<WasmReader> {
  const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmUrl), {})
  const ex = instance.exports as unknown as WasmExports & {
    memory: WebAssembly.Memory
  }
  const bytes = new Uint8Array(await (await fetch(binUrl)).arrayBuffer())
  const ptr = ex.dsidx_alloc(bytes.length)
  // Re-create the view after alloc: a growing memory detaches old buffers.
  new Uint8Array(ex.memory.buffer, ptr, bytes.length).set(bytes)
  const handle = ex.dsidx_open(ptr, bytes.length)
  ex.dsidx_free(ptr, bytes.length)
  if (handle === 0) throw new Error('malformed index bytes')
  return { exports: ex, handle, memory: ex.memory }
}

/** Query an open index; returns the raw JSON results string. */
function runQuery(
  reader: WasmReader,
  query: string,
  limit: number,
): { written: number; json: string } {
  const bytes = new TextEncoder().encode(query)
  const qptr = reader.exports.dsidx_alloc(bytes.length)
  // Re-create the view after alloc (memory may have grown).
  new Uint8Array(reader.memory.buffer, qptr, bytes.length).set(bytes)
  const outCap = 64 * 1024
  const outPtr = reader.exports.dsidx_alloc(outCap)
  const written = reader.exports.dsidx_query(
    reader.handle,
    qptr,
    bytes.length,
    limit,
    outPtr,
    outCap,
  )
  reader.exports.dsidx_free(qptr, bytes.length)
  const raw = new Uint8Array(reader.memory.buffer, outPtr, written).slice()
  reader.exports.dsidx_free(outPtr, outCap)
  return { written, json: new TextDecoder().decode(raw) }
}

const DocSearch = (props: DocSearchProps) => {
  const [query, setQuery] = createSignal('')
  const [open, setOpen] = createSignal(false)
  const [wasmHandle, setWasmHandle] = createSignal<WasmReader | null>(null)
  const [readerFailed, setReaderFailed] = createSignal(false)

  // Lazy reader init: when wasmUrl/binUrl props are wired, load the
  // module + binary index once on mount. A load failure sets a flag so
  // the search path falls back to JSON scoring without retrying.
  onMount(() => {
    const wasm = props.wasmUrl
    const bin = props.binUrl
    if (!wasm || !bin) return
    loadReader(wasm, bin)
      .then(reader => setWasmHandle(reader))
      .catch(() => setReaderFailed(true))
  })

  onMount(() => {
    const wasm = props.wasmUrl
    const bin = props.binUrl
    if (!wasm || !bin) return
    loadReader(wasm, bin)
      .then(reader => setWasmHandle(reader))
      .catch(() => setReaderFailed(true))
  })

  const [corpus] = createResource(
    () => props.indexUrl ?? '/search.json',
    async url => {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`corpus HTTP ${response.status}`)
      return (await response.json()) as CorpusEntry[]
    },
  )

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

  const results = (): Scored[] => {
    const terms = query().toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0 || !corpus()) return []

    // Wasm-first: BM25 in the FST index when the reader is wired
    // (site.toml search_wasm/search_bin); JSON scoring is the fallback
    // when the module fails to load or the props are absent.
    if (props.wasmUrl && props.binUrl && !readerFailed()) {
      const reader = wasmHandle()
      if (!reader) return []
      const { written, json } = runQuery(reader, query(), 8)
      if (written > 0) {
        const hits = JSON.parse(json) as Array<{ doc: number; score: number }>
        const entries = corpus() ?? []
        const out: Scored[] = []
        for (const hit of hits) {
          const entry = entries[hit.doc]
          if (!entry) continue
          const bodyPos = entry.body.toLowerCase().indexOf(terms[0])
          const snippet =
            bodyPos >= 0
              ? `${bodyPos > 40 ? '...' : ''}${entry.body.slice(Math.max(0, bodyPos - 40), bodyPos + 120)}...`
              : entry.description
          out.push({ entry, score: hit.score, snippet })
        }
        return out
      }
    }

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
