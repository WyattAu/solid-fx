// solid-fx SEO widget demo — original component (not a port).
import { createSignal, For } from 'solid-js'
import MetaPreview from './MetaPreview'
import type { MetaPreviewVariant } from './MetaPreview'

const VARIANTS: MetaPreviewVariant[] = ['all', 'google', 'og', 'twitter']

function MetaPreviewDemo() {
  const [variant, setVariant] = createSignal<MetaPreviewVariant>('all')
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
      <MetaPreview
        variant={variant()}
        title="SolidJS Effects Library — Animated Components for Solid"
        description="60+ animated, interactive SolidJS components ported component-for-component. Drop them into any Astro or Solid app and ship motion today."
        url="https://solid-fx.dev/components/animated-content"
        image="https://picsum.photos/seed/metapreview/1200/630"
        siteName="solid-fx"
        twitterHandle="@solidfx"
      />
    </div>
  )
}

export default MetaPreviewDemo
