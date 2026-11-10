// solid-fx scenes layer — composition, not a port.
import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import DotField from '@/content/Backgrounds/DotField/DotField'
import GridMotion from '@/content/Backgrounds/GridMotion/GridMotion'
import Counter from '@/content/Components/Counter/Counter'
import GlassSurface from '@/content/Components/GlassSurface/GlassSurface'

export interface StatsItem {
  label: string
  value: number
  /** Rendered after the animated number (e.g. '+', '%'). */
  suffix?: string
}

export interface StatsSceneProps {
  stats: StatsItem[]
  /**
   * Backdrop behind the stat cards: `dots` is an interactive DotField,
   * `grid` a drifting GridMotion tile field seeded with the stat labels,
   * `none` disables the backdrop.
   * @default 'dots'
   */
  backdrop?: 'dots' | 'grid' | 'none'
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export default function StatsScene(props: StatsSceneProps) {
  const backdrop = () => props.backdrop ?? 'dots'
  const mergedClass = () =>
    ['fx-scene-stats', props.class, props.className].filter(Boolean).join(' ')

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
              items={props.stats.map(stat => stat.label)}
              rows={3}
              speed={0.6}
              dim={0.55}
              theme="dark"
            />
          </div>
        </Show>

        <div
          class="relative z-10 grid items-stretch gap-6"
          style={{ 'grid-template-columns': 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          <For each={props.stats}>
            {stat => (
              <GlassSurface width="100%" height="100%" borderRadius={18}>
                <div class="flex h-full flex-col items-center justify-center gap-3 p-7 text-center">
                  <Counter
                    value={stat.value}
                    suffix={stat.suffix}
                    fontSize={40}
                    fontWeight={600}
                    textColor="#f4f4f5"
                    duration={0.9}
                  />
                  <span class="text-xs font-medium tracking-wider text-white/60 uppercase">
                    {stat.label}
                  </span>
                </div>
              </GlassSurface>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
