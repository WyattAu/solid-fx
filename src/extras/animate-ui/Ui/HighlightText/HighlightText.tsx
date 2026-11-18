// solid-fx TextAnimations widget — port of the Animate UI Highlight Text
// primitive (MIT + Commons Clause — see LICENSE-SOURCES.md). A background
// highlight sweeps in from the left, like a marker dragged across the text
// (Solid + CSS rewrite of the motion-based React original).
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'

export interface HighlightTextProps {
  children: string
  /** Highlight color (default amber-500 33% alpha). */
  color?: string
  /** Sweep duration in ms (default 600). */
  duration?: number
  /** Delay before the sweep in ms (default 150). */
  delay?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const KEYFRAME = `
@keyframes anui-highlight-sweep {
  from { background-size: 0% 100%; }
  to { background-size: 100% 100%; }
}
`

export function HighlightText(props: HighlightTextProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'color',
    'duration',
    'delay',
    'class',
    'className',
    'style',
  ])

  let el!: HTMLSpanElement

  onMount(() => {
    el.style.backgroundImage = `linear-gradient(90deg, ${own.color ?? 'rgba(245, 158, 11, 0.33)'}, ${own.color ?? 'rgba(245, 158, 11, 0.33)'})`
    el.style.backgroundRepeat = 'no-repeat'
    el.style.backgroundSize = '0% 100%'
    el.style.animation = `anui-highlight-sweep ${own.duration ?? 600}ms ${own.delay ?? 150}ms forwards ease-out`
  })

  return (
    <>
      <style>{KEYFRAME}</style>
      <span
        ref={el}
        {...rest}
        class={`anui-highlight ${own.class ?? ''} ${own.className ?? ''}`}
        style={own.style}
      >
        {props.children}
      </span>
    </>
  )
}

export default HighlightText
