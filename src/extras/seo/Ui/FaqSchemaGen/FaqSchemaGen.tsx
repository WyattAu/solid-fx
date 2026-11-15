// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import { createMemo, createSignal, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export interface FaqSchemaGenProps {
  /** Site name injected as the publisher of the generated FAQPage. */
  publisher?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface QaPair {
  question: string
  answer: string
}

const FaqSchemaGen = (props: FaqSchemaGenProps) => {
  const [publisher, setPublisher] = createSignal(props.publisher ?? '')
  const [pairs, setPairs] = createSignal<QaPair[]>([
    { question: 'Does it work offline?', answer: 'Yes - everything runs client-side.' },
  ])
  const [copied, setCopied] = createSignal(false)

  const update = (index: number, field: keyof QaPair, value: string) => {
    setPairs(pairs => pairs.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }
  const addPair = () => setPairs(pairs => [...pairs, { question: '', answer: '' }])
  const removePair = (index: number) => setPairs(pairs => pairs.filter((_, i) => i !== index))

  const complete = () => pairs().filter(p => p.question.trim() && p.answer.trim())
  const jsonLd = createMemo(() => {
    const filled = complete()
    if (filled.length === 0) return ''
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: filled.map(p => ({
        '@type': 'Question',
        name: p.question,
        acceptedAnswer: { '@type': 'Answer', text: p.answer },
      })),
    }
    const publisherName = publisher().trim()
    if (publisherName) {
      schema.publisher = { '@type': 'Organization', name: publisherName }
    }
    return JSON.stringify(schema, null, 2)
  })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(jsonLd())
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
      <div class="flex items-center gap-2">
        <input
          type="text"
          value={publisher()}
          onInput={e => setPublisher(e.currentTarget.value)}
          placeholder="publisher (optional)"
          class="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={addPair}
          class="rounded border border-emerald-600/60 bg-emerald-600/20 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-600/30"
        >
          + question
        </button>
        <Show when={jsonLd()}>
          <button
            type="button"
            onClick={copy}
            class="rounded border border-cyan-600/60 bg-cyan-600/20 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-600/30"
          >
            {copied() ? 'copied' : 'copy'}
          </button>
        </Show>
      </div>

      <div class="max-h-40 space-y-2 overflow-y-auto pr-1">
        <For each={pairs()}>
          {(pair, index) => (
            <div class="rounded border border-gray-800 bg-gray-900/60 p-2">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs text-gray-500">Q{index() + 1}</span>
                <input
                  type="text"
                  value={pair.question}
                  onInput={e => update(index(), 'question', e.currentTarget.value)}
                  placeholder="question"
                  class="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => removePair(index())}
                  class="rounded border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800"
                >
                  x
                </button>
              </div>
              <textarea
                value={pair.answer}
                onInput={e => update(index(), 'answer', e.currentTarget.value)}
                rows={2}
                placeholder="answer"
                class="mt-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </For>
      </div>

      <Show
        when={jsonLd()}
        fallback={
          <p class="font-mono text-xs text-gray-500">add at least one complete question + answer</p>
        }
      >
        <p class="font-mono text-xs text-gray-500">
          FAQPage JSON-LD, {jsonLd().length} bytes - paste into the page head or body
        </p>
        <pre class="min-h-0 flex-1 overflow-auto rounded-lg bg-gray-950 p-3 font-mono text-xs leading-relaxed text-gray-200">
          {jsonLd()}
        </pre>
      </Show>
    </div>
  )
}

export default FaqSchemaGen
