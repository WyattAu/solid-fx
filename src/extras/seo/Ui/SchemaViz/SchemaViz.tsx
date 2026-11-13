// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import { createMemo, createSignal, For, Show, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export type SchemaVizVariant = 'tree' | 'json' | 'both'

export interface SchemaVizProps {
  /** A JSON-LD object (e.g. an Article/Product/Person schema node). */
  data: unknown
  /** Which views to render. @default 'both' */
  variant?: SchemaVizVariant
  class?: string
  /** Solid class alias, merged alongside `class`. */
  className?: string
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Stable sort: @-keys first (context/type/id), then known schema props, then the rest. */
function entriesOf(value: unknown): [string, unknown][] {
  if (Array.isArray(value)) return value.map((v, i) => [String(i), v] as [string, unknown])
  if (!isPlainObject(value)) return []
  const keys = Object.keys(value)
  const weight = (k: string) =>
    k === '@context' ? 0 : k === '@type' ? 1 : k.startsWith('@') ? 2 : 3
  return keys
    .sort((a, b) => weight(a) - weight(b) || a.localeCompare(b))
    .map(k => [k, value[k]] as [string, unknown])
}

/** Human label for a schema node: the @type value if present. */
function nodeLabel(value: unknown): string | null {
  if (isPlainObject(value) && typeof value['@type'] === 'string') return value['@type']
  if (isPlainObject(value) && Array.isArray(value['@type'])) {
    const t = value['@type'] as unknown[]
    return t.filter(x => typeof x === 'string').join(' + ')
  }
  return null
}

function formatLeaf(value: unknown): { text: string; kind: 'string' | 'number' | 'bool' | 'null' } {
  if (typeof value === 'string') return { text: `"${value}"`, kind: 'string' }
  if (typeof value === 'number') return { text: String(value), kind: 'number' }
  if (typeof value === 'boolean') return { text: String(value), kind: 'bool' }
  return { text: 'null', kind: 'null' }
}

const KIND_COLOR: Record<'string' | 'number' | 'bool' | 'null', string> = {
  string: 'text-emerald-300',
  number: 'text-amber-300',
  bool: 'text-violet-300',
  null: 'text-zinc-500',
}

/** Collapsible node in the schema tree. One signal per instance. */
function SchemaNode(props: { label: string; value: unknown; depth: number }) {
  const [open, setOpen] = createSignal(props.depth < 2)
  const entries = createMemo(() => entriesOf(props.value))
  const type = () => nodeLabel(props.value)
  const isBranch = () => Array.isArray(props.value) || isPlainObject(props.value)

  return (
    <div
      class="font-mono text-xs leading-relaxed"
      style={{ 'padding-left': props.depth > 0 ? '1rem' : '0' }}
    >
      <Show
        when={isBranch()}
        fallback={
          <div class="flex gap-2">
            <span class="text-cyan-300">{props.label}</span>
            <span class="text-zinc-600">:</span>
            <span class={KIND_COLOR[formatLeaf(props.value).kind]}>
              {formatLeaf(props.value).text}
            </span>
          </div>
        }
      >
        <button
          type="button"
          class="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-white/5"
          onClick={() => setOpen(!open())}
          aria-expanded={open()}
        >
          <span class="w-3 shrink-0 text-zinc-500">{open() ? '▾' : '▸'}</span>
          <span class="text-cyan-300">{props.label}</span>
          <Show when={type()}>
            <span class="rounded bg-violet-500/15 px-1.5 py-px text-[10px] font-semibold tracking-wide text-violet-300">
              {type()}
            </span>
          </Show>
          <span class="text-zinc-600">
            {Array.isArray(props.value) ? `[${entries().length}]` : `{${entries().length}}`}
          </span>
        </button>
        <Show when={open()}>
          <For each={entries()}>
            {([key, child]) => <SchemaNode label={key} value={child} depth={props.depth + 1} />}
          </For>
        </Show>
      </Show>
    </div>
  )
}

/** Minimal JSON syntax highlighter (regex tokenizer over a pretty-printed string). */
function highlightJson(source: string): { text: string; cls: string }[] {
  const re =
    /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
  const out: { text: string; cls: string }[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    if (m.index > last) out.push({ text: source.slice(last, m.index), cls: 'text-zinc-600' })
    if (m[1]) out.push({ text: m[1], cls: 'text-sky-300' })
    else if (m[2]) out.push({ text: m[2], cls: 'text-emerald-300' })
    else if (m[3]) out.push({ text: m[3], cls: 'text-violet-300' })
    else if (m[4]) out.push({ text: m[4], cls: 'text-zinc-500' })
    else if (m[5]) out.push({ text: m[5], cls: 'text-amber-300' })
    last = m.index + m[0].length
  }
  if (last < source.length) out.push({ text: source.slice(last), cls: 'text-zinc-600' })
  return out
}

/**
 * Renders a JSON-LD structured-data object as an expandable schema.org tree
 * and/or a highlighted JSON view, so you can sanity-check rich-result markup.
 */
export default function SchemaViz(props: SchemaVizProps): JSX.Element {
  const [own, rest] = splitProps(props, ['data', 'variant', 'class', 'className'])
  const variant = () => own.variant ?? 'both'
  const json = createMemo(() => JSON.stringify(own.data, null, 2))
  const roots = createMemo(() => entriesOf(own.data))
  const panel = (extra: string) =>
    `${extra} rounded-xl border border-white/10 bg-zinc-900/60 p-4 ${own.class ?? ''} ${own.className ?? ''}`.trim()

  return (
    <div
      class="flex w-full flex-col gap-4"
      {...rest}
      aria-label="JSON-LD structured data visualization"
    >
      <Show when={variant() === 'tree' || variant() === 'both'}>
        <div class={panel('max-h-96 overflow-auto')}>
          <div class="mb-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            Schema tree
          </div>
          <For each={roots()}>
            {([key, child]) => <SchemaNode label={key} value={child} depth={0} />}
          </For>
        </div>
      </Show>
      <Show when={variant() === 'json' || variant() === 'both'}>
        <div class={panel('max-h-96 overflow-auto')}>
          <div class="mb-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            JSON-LD
          </div>
          <pre class="font-mono text-xs leading-relaxed">
            <For each={highlightJson(json())}>{tok => <span class={tok.cls}>{tok.text}</span>}</For>
          </pre>
        </div>
      </Show>
    </div>
  )
}
