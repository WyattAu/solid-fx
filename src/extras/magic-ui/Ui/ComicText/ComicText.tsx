// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/comic-text.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.

import { animate } from 'motion'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'

interface ComicTextProps {
  children: string
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  style?: JSX.CSSProperties
  fontSize?: number
}

export function ComicText(props: ComicTextProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'style',
    'fontSize',
  ])

  // Upstream: runtime validation, one-shot in the Solid body (component
  // bodies run once per instance), same as upstream's per-render pass.
  if (typeof own.children !== 'string') {
    throw new Error('children must be a string')
  }

  const fontSize = () => own.fontSize ?? 5

  const dotColor = '#EF4444'
  const backgroundColor = '#FACC15'

  let el!: HTMLDivElement

  // Upstream: motion.div with
  // initial={{ opacity: 0, scale: 0.8, rotate: -2 }} and a spring entrance.
  // PORT-NOTE: vanilla `animate` drives the same keyframes with the upstream
  // bezier ease ([0.175, 0.885, 0.32, 1.275]) and duration 0.6 — the React
  // spring (which also used that bezier as its duration approximation) is
  // replaced by the explicit ease.
  onMount(() => {
    const controls = animate(
      el,
      { opacity: [0, 1], scale: [0.8, 1], rotate: [-2, 0] },
      { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] },
    )
    onCleanup(() => controls.stop())
  })

  return (
    <div
      ref={el}
      {...rest}
      class={`text-center select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={{
        'font-size': `${fontSize()}rem`,
        'font-family': "'Bangers', 'Comic Sans MS', 'Impact', sans-serif",
        'font-weight': '900',
        // Thick black outline
        '-webkit-text-stroke': `${fontSize() * 0.35}px #000000`,
        transform: 'skewX(-10deg)',
        'text-transform': 'uppercase',
        filter: `
          drop-shadow(5px 5px 0px #000000)
          drop-shadow(3px 3px 0px ${dotColor})
        `,
        'background-color': backgroundColor,
        'background-image': `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
        'background-size': '8px 8px',
        'background-clip': 'text',
        '-webkit-background-clip': 'text',
        '-webkit-text-fill-color': 'transparent',
        ...own.style,
      }}
    >
      {own.children}
    </div>
  )
}

export default ComicText
