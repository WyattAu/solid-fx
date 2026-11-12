// solid-fx scenes layer — composition, not a port.
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import FadeContent from '@/content/Animations/FadeContent/FadeContent'
import StarBorder from '@/content/Animations/StarBorder/StarBorder'
import DotField from '@/content/Backgrounds/DotField/DotField'

export interface CTASceneProps {
  /** Headline above the CTA. */
  heading: string
  /** Supporting line under the heading. */
  subheading?: string
  /** CTA label, rendered inside a StarBorder frame. */
  ctaText: string
  /** CTA target URL. */
  ctaHref: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export default function CTAScene(props: CTASceneProps) {
  const mergedClass = () => ['fx-scene-cta', props.class, props.className].filter(Boolean).join(' ')

  return (
    <div class={mergedClass()} style={props.style}>
      <div class="relative isolate w-full overflow-hidden rounded-2xl border border-white/5 bg-[#05060f] px-8 py-20">
        {/* Background layer: interactive DotField fills the panel. */}
        <div class="absolute inset-0 -z-10" aria-hidden="true">
          <DotField opacity={0.5} />
        </div>

        {/* Foreground: content fades in from a soft blur on mount. */}
        <FadeContent
          trigger="mount"
          blur
          duration={0.8}
          class="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 text-center"
        >
          <h2 class="text-3xl font-bold text-white sm:text-4xl">{props.heading}</h2>
          <Show when={props.subheading}>
            <p class="max-w-xl text-base leading-relaxed text-white/70">{props.subheading}</p>
          </Show>
          <StarBorder class="fx-scene-cta-frame" color="#38bdf8" thickness={2} radius={12}>
            <a
              href={props.ctaHref}
              class="fx-scene-cta-link block px-8 py-3 text-sm font-semibold text-white"
            >
              {props.ctaText}
            </a>
          </StarBorder>
        </FadeContent>
      </div>
    </div>
  )
}
