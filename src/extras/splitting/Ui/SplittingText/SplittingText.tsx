// solid-fx TextAnimations widget — Solid wrapper over the splitting engine
// (MIT — see LICENSE-SOURCES.md). Splits text into chars/words/lines as
// CSS-var spans, then staggers them in with a CSS animation driven by
// --char-index. Reduced motion renders the plain text immediately.
import { Splitting } from 'splitting'
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'

export interface SplittingTextProps {
  children: string
  /** Split granularity (default 'chars'). */
  by?: 'chars' | 'words'
  /** Stagger delay between units in ms (default 30). */
  stagger?: number
  /** Per-unit entrance duration in ms (default 450). */
  duration?: number
  /** Trigger once the element enters the viewport (default true). */
  showOnView?: boolean
  /** Element tag to render (default 'span'). */
  as?: 'span' | 'p' | 'h2' | 'h3'
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const STYLE = `
@keyframes split-in-up {
  from { opacity: 0; transform: translateY(0.6em) rotateX(40deg); }
  to { opacity: 1; transform: translateY(0) rotateX(0deg); }
}
.splitting-in .char, .splitting-in .word {
  display: inline-block;
  animation: split-in-up var(--split-duration, 450ms) both;
  animation-delay: calc(var(--char-index, 0) * var(--split-stagger, 30ms));
}
@media (prefers-reduced-motion: reduce) {
  .splitting-in .char, .splitting-in .word { animation: none; }
}
`

export function SplittingText(props: SplittingTextProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'by',
    'stagger',
    'duration',
    'showOnView',
    'as',
    'class',
    'className',
    'style',
  ])

  let el!: HTMLElement
  const [visible, setVisible] = createSignal(!(own.showOnView ?? true))
  let observer: IntersectionObserver | null = null

  onMount(() => {
    const run = () => {
      if (visible()) return
      Splitting({ target: el, by: own.by ?? 'chars' })
      el.classList.add('splitting-in')
      el.style.setProperty('--split-stagger', `${own.stagger ?? 30}ms`)
      el.style.setProperty('--split-duration', `${own.duration ?? 450}ms`)
      setVisible(true)
    }
    if (own.showOnView ?? true) {
      observer = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            run()
            observer?.disconnect()
          }
        },
        { threshold: 0.4 },
      )
      observer.observe(el)
    } else {
      run()
    }
    onCleanup(() => observer?.disconnect())
  })

  const Tag = (own.as ?? 'span') as 'span'

  return (
    <>
      <style>{STYLE}</style>
      <Tag
        ref={el}
        {...rest}
        class={`splitting-host ${own.class ?? ''} ${own.className ?? ''}`}
        style={own.style}
      >
        {props.children}
      </Tag>
    </>
  )
}

export default SplittingText
