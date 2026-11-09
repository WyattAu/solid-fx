/**
 * HeroScene — full landing-hero composition (Scenes layer).
 *
 * Composes library parts — Aurora as the background, SplitText for the
 * wordmark (animates on mount via trigger="load"), StarBorder around the
 * CTAs — mirroring the proven pattern in src/site/Landing.astro, but as a
 * reusable Solid component with caller-facing props.
 *
 * Scenes are the ONLY layer allowed to import across src/content.
 */
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import Aurora from '@/content/Backgrounds/Aurora/Aurora'
import StarBorder from '@/content/Animations/StarBorder/StarBorder'
import SplitText from '@/content/TextAnimations/SplitText/SplitText'

export interface HeroSceneCta {
  text: string
  href: string
}

export interface HeroSceneProps {
  /** Headline wordmark, animated on mount. @default 'solid-fx' */
  title?: string
  /** Supporting line under the headline. */
  tagline?: string
  /** Primary call-to-action button (StarBorder-wrapped). */
  ctaPrimary?: HeroSceneCta
  /** Secondary call-to-action button (StarBorder-wrapped). */
  ctaSecondary?: HeroSceneCta
  /** Section height — number (px) or any CSS length. @default '100vh' */
  height?: number | string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const px = (h: number | string): string => (typeof h === 'number' ? `${h}px` : h)

export default function HeroScene(props: HeroSceneProps) {
  const height = () => px(props.height ?? '100vh')
  const mergedClass = () =>
    [
      'fx-scene-hero relative flex w-full items-center justify-center overflow-hidden',
      props.class,
      props.className,
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <section class={mergedClass()} style={{ height: height(), ...props.style }}>
      {/* Background layer: Aurora fills the section absolutely. */}
      <div class="fx-scene-hero-bg absolute inset-0">
        <Aurora
          colorStops={['#3A29FF', '#FF94B4', '#FF3232']}
          speed={0.3}
          scale={0.9}
          amplitude={1.2}
          mouseInteraction={false}
        />
      </div>

      {/* Foreground layer. */}
      <div class="fx-scene-hero-inner relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <SplitText
          text={props.title ?? 'solid-fx'}
          class="fx-scene-title text-5xl font-bold text-white sm:text-6xl"
          trigger="load"
          splitType="chars"
          delay={60}
          duration={900}
        />

        <Show when={props.tagline}>
          <p class="fx-scene-tagline max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            {props.tagline}
          </p>
        </Show>

        <div class="fx-scene-ctas flex flex-wrap items-center justify-center gap-4">
          <Show when={props.ctaPrimary}>
            {cta => (
              <StarBorder class="fx-scene-cta" color="#38bdf8" thickness={2} radius={12}>
                <a
                  href={cta().href}
                  class="fx-scene-cta-link block px-8 py-3 text-sm font-semibold text-white"
                >
                  {cta().text}
                </a>
              </StarBorder>
            )}
          </Show>
          <Show when={props.ctaSecondary}>
            {cta => (
              <StarBorder class="fx-scene-cta" color="#a855f7" thickness={2} radius={12}>
                <a
                  href={cta().href}
                  class="fx-scene-cta-link block px-8 py-3 text-sm font-semibold text-white/90"
                >
                  {cta().text}
                </a>
              </StarBorder>
            )}
          </Show>
        </div>
      </div>
    </section>
  )
}
