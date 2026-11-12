// solid-fx scenes layer — composition, not a port.
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import LogoLoop from '@/content/Animations/LogoLoop/LogoLoop'
import Aurora from '@/content/Backgrounds/Aurora/Aurora'
import GlassSurface from '@/content/Components/GlassSurface/GlassSurface'
import GradientText from '@/content/TextAnimations/GradientText/GradientText'

export interface ShowcaseCard {
  title: string
  description: string
}

export interface ShowcaseSceneProps {
  /** Heading — rendered with GradientText. */
  title: string
  /** Cards in the showcase grid (GlassSurface panels). @default SHOWCASE_CARDS */
  cards?: ShowcaseCard[]
  /** Marquee strip under the grid (LogoLoop text items). @default SHOWCASE_MARQUEE */
  marquee?: string[]
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const SHOWCASE_CARDS: ShowcaseCard[] = [
  {
    title: 'WebGL backgrounds',
    description:
      'Aurora, DotField, GridMotion and 60+ shader-driven scenes — every one drops into a plain div.',
  },
  {
    title: 'Text animations',
    description:
      'SplitText, GradientText, ScrambledText — character-level motion without a React runtime.',
  },
  {
    title: 'Glass surfaces',
    description:
      'Refraction, displacement and saturation on real backdrop pixels — not a blur filter.',
  },
  {
    title: 'Zero React',
    description:
      'Solid primitives only: onMount, onCleanup, signals. Every loop, listener and GL context disposed.',
  },
]

const SHOWCASE_MARQUEE = [
  'gsap',
  'motion',
  'three.js',
  'ogl',
  'anime.js',
  'tsParticles',
  'tailwind v4',
]

export default function ShowcaseScene(props: ShowcaseSceneProps) {
  const cards = () => props.cards ?? SHOWCASE_CARDS
  const marquee = () => props.marquee ?? SHOWCASE_MARQUEE
  const mergedClass = () =>
    ['fx-scene-showcase', props.class, props.className].filter(Boolean).join(' ')

  return (
    <div class={mergedClass()} style={props.style}>
      <div class="relative isolate w-full overflow-hidden rounded-2xl border border-white/5 bg-[#05060f] px-8 py-14">
        {/* Background layer: Aurora fills the panel. */}
        <div class="absolute inset-0 -z-10" aria-hidden="true">
          <Aurora
            colorStops={['#3A29FF', '#FF94B4', '#FF3232']}
            speed={0.3}
            amplitude={1.1}
            mouseInteraction={false}
          />
        </div>

        <div class="relative z-10 flex flex-col gap-10">
          <GradientText
            class="text-center text-3xl font-bold sm:text-4xl"
            colors={['#7dd3fc', '#c084fc', '#38bdf8']}
            animationSpeed={4}
            variant="flow"
          >
            {props.title}
          </GradientText>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <For each={cards()}>
              {card => (
                <GlassSurface width="100%" height="100%" borderRadius={18}>
                  <div class="flex h-full flex-col gap-3 p-7 text-left">
                    <h3 class="text-lg font-semibold text-white">{card.title}</h3>
                    <p class="text-sm leading-relaxed text-white/70">{card.description}</p>
                  </div>
                </GlassSurface>
              )}
            </For>
          </div>

          <LogoLoop
            logos={marquee().map(text => ({
              node: <span class="text-sm font-medium tracking-wide text-white/60">{text}</span>,
              title: text,
            }))}
            logoHeight={24}
            speed={80}
            gap={48}
            fadeOut
            fadeOutColor="#05060f"
          />
        </div>
      </div>
    </div>
  )
}
