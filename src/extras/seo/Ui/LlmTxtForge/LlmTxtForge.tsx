// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import { createSignal, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export interface LlmTxtForgeProps {
  /** Initial site title (the `# H1` of the generated file). */
  siteTitle?: string
  /** Initial author (`By ...` line; omitted when empty). */
  author?: string
  /** Initial entry lines: `Title | https://url | one-line summary`. */
  entries?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface Entry {
  title: string
  url: string
  summary: string
  /** A malformed line (missing url or summary) - kept, but flagged. */
  valid: boolean
}

const parse = (raw: string): Entry[] =>
  raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [title, url, summary] = line.split('|').map(part => part.trim())
      const valid = Boolean(title && url && summary && url.startsWith('http'))
      return { title: title ?? '', url: url ?? '', summary: summary ?? '', valid }
    })

const forge = (siteTitle: string, author: string, entries: Entry[]): string => {
  const out: string[] = [`# ${siteTitle}`, '']
  if (author) out.push(`By ${author}.`, '')
  for (const entry of entries) {
    out.push(`- [${entry.title}](${entry.url}): ${entry.summary}`)
  }
  out.push('')
  return out.join('\n')
}

const LlmTxtForge = (props: LlmTxtForgeProps) => {
  const [siteTitle, setSiteTitle] = createSignal(props.siteTitle ?? 'Documentation')
  const [author, setAuthor] = createSignal(props.author ?? '')
  const [raw, setRaw] = createSignal(
    props.entries ??
      'Getting started | https://docs.example.com/start.html | Install, configure, and render the first page\nSearch | https://docs.example.com/search.html | Query the index client-side or from the compiler\n',
  )
  const [copied, setCopied] = createSignal(false)

  const entries = () => parse(raw())
  const generated = () => forge(siteTitle(), author(), entries())
  const invalidCount = () => entries().filter(e => !e.valid).length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(generated())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard denied: the textarea below stays selectable */
    }
  }

  return (
    <div
      class={`flex h-full w-full flex-col gap-3 ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    >
      <div class="flex gap-2">
        <input
          type="text"
          value={siteTitle()}
          onInput={e => setSiteTitle(e.currentTarget.value)}
          placeholder="site title"
          class="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          value={author()}
          onInput={e => setAuthor(e.currentTarget.value)}
          placeholder="author"
          class="w-32 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={copy}
          class="rounded border border-emerald-600/60 bg-emerald-600/20 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-600/30"
        >
          {copied() ? 'copied' : 'copy'}
        </button>
      </div>

      <textarea
        value={raw()}
        onInput={e => setRaw(e.currentTarget.value)}
        rows={4}
        spellcheck={false}
        class="rounded border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-emerald-500"
      />
      <Show
        when={invalidCount() === 0}
        fallback={
          <p class="font-mono text-xs text-amber-400">
            {invalidCount()} malformed line(s): expected `Title | https://url | summary`
          </p>
        }
      >
        <p class="font-mono text-xs text-gray-500">
          {entries().length} entries, {generated().length} bytes of llms.txt
        </p>
      </Show>

      <pre class="min-h-0 flex-1 overflow-auto rounded-lg bg-gray-950 p-3 font-mono text-xs leading-relaxed text-gray-200">
        {generated()}
      </pre>
    </div>
  )
}

export default LlmTxtForge
