// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import { For, Index, createMemo, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { createTimeline, stagger } from 'animejs'
import { useReducedMotion } from '@/lib/reducedMotion'

interface TimelineTextRevealProps {
  /**
   * Lines of text, revealed in sequence — one timeline segment per line.
   */
  lines: string[]
  /**
   * Stagger between characters inside a line (ms).
   * @default 30
   */
  charDelay?: number
  /**
   * Offset between the starts of consecutive lines (ms).
   * @default 380
   */
  lineDelay?: number
  /**
   * Duration of each character tween (ms).
   * @default 600
   */
  duration?: number
  /**
   * anime.js ease for every tween (e.g. 'outExpo', 'out(3)').
   * @default 'outExpo'
   */
  easing?: string
  /**
   * Replay the whole timeline forever.
   * @default true
   */
  loop?: boolean
  /**
   * Hold at the fully-revealed state between loops (ms).
   * @default 1800
   */
  loopDelay?: number
  /**
   * The class of the text block.
   */
  class?: string
  /**
   * React-style class alias, merged alongside `class`.
   */
  className?: string
  /**
   * The style of the text block.
   */
  style?: JSX.CSSProperties
}

export const TimelineTextReveal = (
  props: TimelineTextRevealProps & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'>,
) => {
  const [local, rest] = splitProps(props, [
    'lines',
    'charDelay',
    'lineDelay',
    'duration',
    'easing',
    'loop',
    'loopDelay',
    'class',
    'className',
    'style',
  ])
  const charDelay = () => local.charDelay ?? 30
  const lineDelay = () => local.lineDelay ?? 380
  const duration = () => local.duration ?? 600
  const easing = () => local.easing ?? 'outExpo'
  const loop = () => local.loop ?? true
  const loopDelay = () => local.loopDelay ?? 1800

  const reduced = useReducedMotion()

  const charsByLine = createMemo(() => local.lines.map((line) => Array.from(line)))

  // Callback refs collect char spans in document order; read once at mount.
  const charEls: HTMLSpanElement[][] = []

  onMount(() => {
    if (reduced()) return // markup already authors the final state
    const tl = createTimeline({
      defaults: { ease: easing(), duration: duration() },
      ...(loop() ? { loop: true, loopDelay: loopDelay() } : {}),
    })
    charEls.forEach((chars, lineIndex) => {
      tl.add(
        chars,
        {
          opacity: [0, 1],
          translateY: ['110%', '0%'],
          delay: stagger(charDelay(), { from: 'first' }),
        },
        lineIndex * lineDelay(),
      )
    })
    onCleanup(() => tl.revert())
  })

  return (
    <div
      {...rest}
      class={`select-none ${local.class ?? ''} ${local.className ?? ''}`}
      style={local.style}
    >
      <For each={charsByLine()}>
        {(chars, lineIndex) => (
          <div class="overflow-hidden py-[0.08em] leading-tight">
            <Index each={chars}>
              {(char, charIndex) => (
                <span
                  ref={(el) => {
                    if (!charEls[lineIndex()]) charEls[lineIndex()] = []
                    charEls[lineIndex()][charIndex] = el
                  }}
                  class="inline-block will-change-transform"
                  style={reduced() ? undefined : { opacity: 0, transform: 'translateY(110%)' }}
                >
                  {char() === ' ' ? '\u00A0' : char()}
                </span>
              )}
            </Index>
          </div>
        )}
      </For>
    </div>
  )
}

export default TimelineTextReveal
