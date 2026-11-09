/**
 * FeatureShowcase — glass-card feature-grid scene (Scenes layer).
 *
 * Composes GlassSurface panels (src/content) with icon + title + description
 * and a subtle pointer-driven tilt. Scenes are the ONLY layer allowed to
 * import across src/content; `@/lib` helpers stay usable from any layer.
 */
import type { JSX } from 'solid-js'
import { For, Show, onCleanup } from 'solid-js'
import GlassSurface from '@/content/Components/GlassSurface/GlassSurface'
import HugeiconsIcon, { type IconSvgObject } from '@/lib/HugeiconsIcon'

export interface FeatureShowcaseFeature {
  title: string
  description: string
  /** Optional hugeicons data (`@hugeicons/core-free-icons` constants). */
  icon?: IconSvgObject
  /** Icon stroke color. @default '#7dd3fc' */
  iconColor?: string
}

export interface FeatureShowcaseProps {
  features: FeatureShowcaseFeature[]
  /** Grid columns. @default 3 */
  columns?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const MAX_TILT = 6 // degrees

/**
 * Subtle tilt-on-hover wrapper: transform is written straight to the DOM on
 * pointer events (no signals — pointermove is too hot for reactive updates).
 * JSX handlers are disposed with the element by Solid itself.
 */
function TiltCard(props: { children: JSX.Element }) {
  let el!: HTMLDivElement
  const onMove = (e: PointerEvent) => {
    const target = e.currentTarget as HTMLElement | null
    if (!target) return
    const rect = target.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${(-ny * MAX_TILT).toFixed(2)}deg) rotateY(${(nx * MAX_TILT).toFixed(2)}deg)`
  }
  const onLeave = () => {
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
  }
  onCleanup(() => {
    // Release the inline transform so unmount leaves no stale style.
    el.style.transform = ''
  })
  return (
    <div
      ref={el}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      class="fx-scene-tilt h-full will-change-transform"
      style={{ transition: 'transform 150ms ease-out' }}
    >
      {props.children}
    </div>
  )
}

export default function FeatureShowcase(props: FeatureShowcaseProps) {
  const columns = () => props.columns ?? 3
  const mergedClass = () =>
    ['fx-scene-features', props.class, props.className].filter(Boolean).join(' ')

  return (
    <div class={mergedClass()} style={props.style}>
      <div
        class="fx-scene-features-grid grid gap-6"
        style={{ 'grid-template-columns': `repeat(${columns()}, minmax(0, 1fr))` }}
      >
        <For each={props.features}>
          {feature => (
            <TiltCard>
              <GlassSurface width="100%" height="100%" borderRadius={20} class="fx-scene-glass">
                <div class="flex h-full flex-col gap-3 p-7 text-left">
                  <Show when={feature.icon} fallback={<div class="h-7 w-7" aria-hidden="true" />}>
                    {icon => (
                      <HugeiconsIcon
                        icon={icon()}
                        size={28}
                        color={feature.iconColor ?? '#7dd3fc'}
                        strokeWidth={1.5}
                      />
                    )}
                  </Show>
                  <h3 class="text-lg font-semibold text-white">{feature.title}</h3>
                  <p class="text-sm leading-relaxed text-white/70">{feature.description}</p>
                </div>
              </GlassSurface>
            </TiltCard>
          )}
        </For>
      </div>
    </div>
  )
}
