// solid-fx scenes layer — composition, not a port.
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import GlassSurface from '@/content/Components/GlassSurface/GlassSurface'
import DecryptedText from '@/content/TextAnimations/DecryptedText/DecryptedText'

export interface TestimonialItem {
  quote: string
  author: string
}

export interface TestimonialSceneProps {
  testimonials: TestimonialItem[]
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export default function TestimonialScene(props: TestimonialSceneProps) {
  const mergedClass = () =>
    ['fx-scene-testimonials', props.class, props.className].filter(Boolean).join(' ')

  return (
    <div class={mergedClass()} style={props.style}>
      <div
        class="grid items-stretch gap-6"
        style={{ 'grid-template-columns': 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        <For each={props.testimonials}>
          {testimonial => (
            <GlassSurface width="100%" height="100%" borderRadius={18}>
              <figure class="flex h-full flex-col gap-4 p-7 text-left">
                <span class="select-none text-3xl leading-none text-white/25" aria-hidden="true">
                  &ldquo;
                </span>
                <blockquote class="flex-1 text-sm leading-relaxed text-white/85">
                  <DecryptedText
                    text={testimonial.quote}
                    animateOn="view"
                    speed={3}
                    useOriginalCharsOnly
                    scrambleColor="#818cf8"
                    encryptedClassName="text-white/30"
                  />
                </blockquote>
                <figcaption class="flex items-center gap-3">
                  <span class="h-px w-8 bg-white/25" aria-hidden="true" />
                  <span class="text-sm font-medium text-white/70">{testimonial.author}</span>
                </figcaption>
              </figure>
            </GlassSurface>
          )}
        </For>
      </div>
    </div>
  )
}
