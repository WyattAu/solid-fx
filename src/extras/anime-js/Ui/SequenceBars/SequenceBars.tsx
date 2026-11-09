// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import { For, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { createTimeline, stagger } from 'animejs'
import { useReducedMotion } from '@/lib/reducedMotion'

interface SequenceBarsProps {
  /**
   * Final bar heights, as percentages of the chart height. Each entry is one bar.
   * @default [55, 82, 40, 96, 63, 30]
   */
  values?: number[]
  /**
   * Gap between bars (px).
   * @default 12
   */
  barGap?: number
  /**
   * Per-bar grow duration (ms).
   * @default 700
   */
  growDuration?: number
  /**
   * Stagger between bar grow starts (ms).
   * @default 120
   */
  barDelay?: number
  /**
   * Stagger between value-label pop-ins (ms).
   * @default 70
   */
  labelDelay?: number
  /**
   * Hold (ms) at the fully-grown chart before the retract segment (chained via '+=').
   * @default 900
   */
  holdMs?: number
  /**
   * Per-bar retract duration (ms).
   * @default 600
   */
  retractDuration?: number
  /**
   * anime.js ease for every tween.
   * @default 'outExpo'
   */
  easing?: string
  /**
   * Replay the whole sequence forever.
   * @default true
   */
  loop?: boolean
  /**
   * Empty-chart pause between loops (ms).
   * @default 400
   */
  loopDelay?: number
  /**
   * Bar and label accent color.
   * @default '#818cf8'
   */
  accent?: string
  /**
   * The class of the chart container.
   */
  class?: string
  /**
   * React-style class alias, merged alongside `class`.
   */
  className?: string
  /**
   * The style of the chart container.
   */
  style?: JSX.CSSProperties
}

export const SequenceBars = (
  props: SequenceBarsProps & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'>,
) => {
  const [local, rest] = splitProps(props, [
    'values',
    'barGap',
    'growDuration',
    'barDelay',
    'labelDelay',
    'holdMs',
    'retractDuration',
    'easing',
    'loop',
    'loopDelay',
    'accent',
    'class',
    'className',
    'style',
  ])
  const values = () => local.values ?? [55, 82, 40, 96, 63, 30]
  const barGap = () => local.barGap ?? 12
  const growDuration = () => local.growDuration ?? 700
  const barDelay = () => local.barDelay ?? 120
  const labelDelay = () => local.labelDelay ?? 70
  const holdMs = () => local.holdMs ?? 900
  const retractDuration = () => local.retractDuration ?? 600
  const easing = () => local.easing ?? 'outExpo'
  const loop = () => local.loop ?? true
  const loopDelay = () => local.loopDelay ?? 400
  const accent = () => local.accent ?? '#818cf8'

  const reduced = useReducedMotion()

  // Callback refs collect bars and labels in document order; read once at mount.
  const barEls: HTMLDivElement[] = []
  const labelEls: HTMLDivElement[] = []

  onMount(() => {
    if (reduced() || !barEls.length) return // markup already authors the final state
    const tl = createTimeline({
      defaults: { ease: easing(), duration: growDuration() },
      ...(loop() ? { loop: true, loopDelay: loopDelay() } : {}),
    })
    // Segment 1: bars grow bottom-up, staggered left → right (chained at end).
    tl.add(barEls, {
      scaleY: [0, 1],
      delay: stagger(barDelay(), { from: 'first' }),
    })
    // Segment 2: value labels pop in while the last bars are still landing ('-=250').
    tl.add(
      labelEls,
      {
        opacity: [0, 1],
        translateY: ['-4px', '0px'],
        duration: 400,
        delay: stagger(labelDelay(), { from: 'first' }),
      },
      '-=250',
    )
    // Segment 3: hold the finished chart, then retract right → left.
    tl.add(
      barEls,
      {
        scaleY: [1, 0],
        duration: retractDuration(),
        delay: stagger(barDelay() * 0.5, { from: 'last' }),
      },
      `+=${holdMs()}`,
    )
    // Segment 4: labels fade out as the retract begins ('<<' = retract's start).
    tl.add(labelEls, { opacity: [1, 0], duration: 300 }, '<<')
    onCleanup(() => tl.revert())
  })

  return (
    <div
      {...rest}
      class={`flex h-full w-full items-end ${local.class ?? ''} ${local.className ?? ''}`}
      style={{ gap: `${barGap()}px`, ...local.style }}
    >
      <For each={values()}>
        {value => (
          <div class="relative h-full min-w-0 flex-1">
            <div
              ref={el => barEls.push(el)}
              class="absolute inset-x-0 bottom-0 rounded-t-sm will-change-transform"
              style={{
                height: `${value}%`,
                'background-color': accent(),
                'transform-origin': 'bottom',
                transform: reduced() ? undefined : 'scaleY(0)',
              }}
            >
              <div
                ref={el => labelEls.push(el)}
                class="absolute inset-x-0 top-1 text-center text-[10px] font-medium tabular-nums"
                style={{ color: accent(), opacity: reduced() ? 1 : 0 }}
              >
                {value}
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

export default SequenceBars
