// Source: github.com/codse/animata animata/text/jitter-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream renders a framer-motion <motion.span> with keyframe
// arrays; this port drives the same keyframes through vanilla motion animate()
// (repeat/repeatDelay/repeatType map 1:1). Upstream merges classes with cn()
// (clsx + tailwind-merge); this port template-joins, equivalent for the plain
// strings passed here.

import { animate } from 'motion'
import { onCleanup, onMount } from 'solid-js'

interface JitteryTextProps {
  /**
   * The text to animate.
   */
  text: string

  /**
   * The duration of one jitter cycle, in seconds.
   */
  duration?: number

  /**
   * Additional classes for the text.
   */
  className?: string
  /** React parity alias; merges with `className`. */
  class?: string
}

export default function JitterText(props: JitteryTextProps) {
  let spanEl!: HTMLSpanElement

  onMount(() => {
    const controls = animate(
      spanEl,
      {
        y: [1.5, 1, -1, 1.5, -1.5, 1, -0.5, 0],
        x: [0, -1, 1.5, -1.5, 1, -1, 0.5, 0],
        rotate: [0.5, -1.5, 1, -1.5, 1, -1, 1, 0],
      },
      {
        repeat: Infinity,
        repeatDelay: 0.5,
        repeatType: 'reverse',
        ease: 'easeInOut',
        duration: props.duration || 0.6,
      },
    )
    onCleanup(() => controls.stop())
  })

  return (
    <div>
      <span ref={spanEl} class={`inline-block ${props.className ?? ''} ${props.class ?? ''}`}>
        {props.text}
      </span>
    </div>
  )
}
