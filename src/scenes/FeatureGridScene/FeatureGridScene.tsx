// solid-fx scenes layer — composition, not a port.
import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import DotField from '@/content/Backgrounds/DotField/DotField'
import GridMotion from '@/content/Backgrounds/GridMotion/GridMotion'
import GlassSurface from '@/content/Components/GlassSurface/GlassSurface'

export interface FeatureGridItem {
  title: string
  description: string
}

export interface FeatureGridSceneProps {
  features: FeatureGridItem[]
  /**
   * Backdrop behind the card grid: `dots` is an interactive DotField,
   * `grid` a drifting GridMotion tile field seeded with the feature titles,
   * `none` disables the backdrop.
   * @default 'dots'
   */
  backdrop?: 'dots' | 'grid' | 'none'
  /** Grid columns. @default 3 */
  columns?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export default function FeatureGridScene(props: FeatureGridSceneProps) {
  const backdrop = () => props.backdrop ?? 'dots'
  const columns = () => props.columns ?? 3
  const mergedClass = () =>
    ['fx-scene-feature-grid', props.class, props.className].filter(Boolean).join(' ')

  return (
    <div class={mergedClass()} style={props.style}>
      <div class="relative isolate w-full overflow-hidden rounded-2xl border border-white/5 bg-[#05060f] px-8 py-14">
        <Show when={backdrop() === 'dots'}>
          <div class="absolute inset-0 -z-10" aria-hidden="true">
            <DotField opacity={0.5} />
          </div>
        </Show>
        <Show when={backdrop() === 'grid'}>
          <div class="absolute inset-0 -z-10" aria-hidden="true">
            <GridMotion
              items={props.features.map(f => f.title)}
              rows={3}
              speed={0.6}
              dim={0.55}
              theme="dark"
            />
          </div>
        </Show>

        <div
          class="relative z-10 grid gap-6"
          style={{ 'grid-template-columns': `repeat(${columns()}, minmax(0, 1fr))` }}
        >
          <For each={props.features}>
            {feature => (
              <GlassSurface width="100%" height="100%" borderRadius={18}>
                <div class="flex h-full flex-col gap-3 p-7 text-left">
                  <h3 class="text-lg font-semibold text-white">{feature.title}</h3>
                  <p class="text-sm leading-relaxed text-white/70">{feature.description}</p>
                </div>
              </GlassSurface>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
