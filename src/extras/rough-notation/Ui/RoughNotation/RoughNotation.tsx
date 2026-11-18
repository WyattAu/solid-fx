// solid-fx TextAnimations widget — Solid wrapper over the rough-notation
// engine (MIT, zero deps — see LICENSE-SOURCES.md). Annotate() attaches a
// hand-drawn SVG sibling in onMount; hide()/remove() run in onCleanup
// (lenis engine pattern). Shows on mount or on first viewport entry.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { annotate } from 'rough-notation'

export interface RoughNotationProps {
  /** The content to annotate. */
  children: JSX.Element
  /** Annotation style (default 'underline'). */
  type?: 'underline' | 'box' | 'circle' | 'highlight' | 'strike-through' | 'crossed-off' | 'bracket'
  /** Annotation color (default '#f59e0b' amber-500). */
  color?: string
  /** Stroke width in px (default 2). */
  strokeWidth?: number
  /** Padding around the element in px (default 5). */
  padding?: number
  /** Animation duration in ms (default 800; 0 = instant). */
  animationDuration?: number
  /** Draw on first viewport entry instead of immediately (default true). */
  showOnView?: boolean
  /** Element tag to render (default 'span'; use an inline tag — block tags break the SVG sibling). */
  as?: 'span' | 'em' | 'strong' | 'code'
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function RoughNotation(props: RoughNotationProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'type',
    'color',
    'strokeWidth',
    'padding',
    'animationDuration',
    'showOnView',
    'as',
    'class',
    'className',
    'style',
  ])

  let el!: HTMLSpanElement
  let annotation: ReturnType<typeof annotate> | null = null
  let observer: IntersectionObserver | null = null
  const [shown, setShown] = createSignal(false)

  onMount(() => {
    annotation = annotate(el, {
      type: own.type ?? 'underline',
      color: own.color ?? '#f59e0b',
      strokeWidth: own.strokeWidth ?? 2,
      padding: own.padding ?? 5,
      animationDuration: own.animationDuration ?? 800,
    })

    const show = () => {
      if (shown()) return
      annotation?.show()
      setShown(true)
    }

    if ((own.showOnView ?? true) && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            show()
            observer?.disconnect()
          }
        },
        { threshold: 0.6 },
      )
      observer.observe(el)
    } else {
      show()
    }

    onCleanup(() => {
      observer?.disconnect()
      annotation?.remove()
    })
  })

  const Tag = own.as ?? 'span'

  return (
    <Tag
      ref={el}
      {...rest}
      class={`rough-notation-host ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
      data-shown={shown() ? 'true' : undefined}
    >
      {props.children}
    </Tag>
  )
}

export default RoughNotation
