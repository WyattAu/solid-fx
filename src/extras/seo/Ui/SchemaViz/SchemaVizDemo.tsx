// solid-fx SEO widget demo — original component (not a port).
import { createSignal, For } from 'solid-js'
import SchemaViz from './SchemaViz'
import type { SchemaVizVariant } from './SchemaViz'

const SAMPLE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'SolidJS Effects Library — Animated Components for Solid',
  description: '60+ animated, interactive SolidJS components ported component-for-component.',
  image: ['https://solid-fx.dev/og.png'],
  author: {
    '@type': 'Organization',
    name: 'solid-fx',
    url: 'https://solid-fx.dev',
  },
  publisher: {
    '@type': 'Organization',
    name: 'solid-fx',
    logo: { '@type': 'ImageObject', url: 'https://solid-fx.dev/logo.png' },
  },
  datePublished: '2026-10-01T08:00:00+00:00',
  keywords: ['solidjs', 'animation', 'components'],
  isAccessibleForFree: true,
}

const VARIANTS: SchemaVizVariant[] = ['both', 'tree', 'json']

function SchemaVizDemo() {
  const [variant, setVariant] = createSignal<SchemaVizVariant>('both')
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-5 overflow-auto bg-gray-950 p-6">
      <div class="flex flex-wrap justify-center gap-2">
        <For each={VARIANTS}>
          {v => (
            <button
              type="button"
              class={`rounded-lg px-3 py-1 text-xs ${
                variant() === v
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-zinc-400 hover:bg-white/15'
              }`}
              onClick={() => setVariant(v)}
            >
              {v}
            </button>
          )}
        </For>
      </div>
      <SchemaViz data={SAMPLE_SCHEMA} variant={variant()} />
    </div>
  )
}

export default SchemaVizDemo
