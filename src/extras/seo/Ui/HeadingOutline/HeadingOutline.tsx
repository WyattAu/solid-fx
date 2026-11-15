// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import { createMemo, createSignal, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export interface HeadingOutlineProps {
  /** Initial HTML to audit (headings are parsed from it). */
  html?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface HeadingEntry {
  level: number
  text: string
}

const parseOutline = (html: string): HeadingEntry[] => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const out: HeadingEntry[] = []
  for (const el of doc.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const level = Number(el.tagName.charAt(1))
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (text) out.push({ level, text })
  }
  return out
}

const HeadingOutline = (props: HeadingOutlineProps) => {
  const [html, setHtml] = createSignal(
    props.html ??
      '<h1>Guide</h1><h2>Setup</h2><h4>Skipped H3</h4><h2>Usage</h2><h3>Options</h3><h2>FAQ</h2>',
  )

  const outline = createMemo(() => parseOutline(html()))
  const h1Count = () => outline().filter(h => h.level === 1).length
  const skips = (): string[] => {
    const problems: string[] = []
    let previous = 0
    for (const h of outline()) {
      if (previous > 0 && h.level > previous + 1) {
        problems.push(`h${previous} -> h${h.level} skips h${previous + 1}`)
      }
      previous = h.level
    }
    return problems
  }
  // Estate-seo floor item 1: exactly one h1, hierarchy never skips.
  const verdict = (): 'pass' | 'warn' => (h1Count() === 1 && skips().length === 0 ? 'pass' : 'warn')

  return (
    <div class={`flex h-full w-full flex-col gap-3 ${props.class ?? ''} ${props.className ?? ''}`} style={props.style}>
      <textarea
        value={html()}
        onInput={e => setHtml(e.currentTarget.value)}
        rows={4}
        spellcheck={false}
        class="rounded border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-emerald-500"
      />
      <div class="flex items-center gap-2">
        <span
          class={`rounded px-2 py-0.5 font-mono text-xs ${
            verdict() === 'pass'
              ? 'border border-emerald-700/60 bg-emerald-950/40 text-emerald-300'
              : 'border border-amber-700/60 bg-amber-950/40 text-amber-300'
          }`}
        >
          {verdict()}
        </span>
        <span class="font-mono text-xs text-gray-400">
          {outline().length} headings, {h1Count()} h1, {skips().length} skipped level(s)
        </span>
      </div>

      <Show when={h1Count() !== 1}>
        <p class="rounded border border-amber-900/60 bg-amber-950/30 px-3 py-2 font-mono text-xs text-amber-300">
          floor rule: exactly one h1 per page (found {h1Count()})
        </p>
      </Show>
      <For each={skips()}>
        {problem => (
          <p class="rounded border border-amber-900/60 bg-amber-950/30 px-3 py-2 font-mono text-xs text-amber-300">
            hierarchy skips: {problem}
          </p>
        )}
      </For>

      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <For each={outline()}>
          {h => (
            <p class="px-1 py-0.5 font-mono text-xs text-gray-200" style={{ 'padding-left': `${(h.level - 1) * 16}px` }}>
              <span class="text-cyan-500">h{h.level}</span> {h.text}
            </p>
          )}
        </For>
        <Show when={outline().length === 0}>
          <p class="px-1 py-2 font-mono text-xs text-gray-500">no headings found in the pasted HTML</p>
        </Show>
      </div>
    </div>
  )
}

export default HeadingOutline
