// solid-fx SEO widget — original component (not a port). Free APIs: none (fetches the site's own search corpus emitted by docs-compiler).
import { createResource, createSignal, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export interface DocSearchProps {
  /** URL of the search corpus (search.json emitted by docs-compiler). */
  indexUrl?: string
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

const DocSearch = (props: DocSearchProps) => {
  const [query, setQuery] = createSignal('')
  const [open, setOpen] = createSignal(false)

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
