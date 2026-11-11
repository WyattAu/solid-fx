// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/typing-animation.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { createEffect, createMemo, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'

// PORT-NOTE: upstream ships the cursor blink through the Tailwind theme
// (`--animate-blink-cursor: blink-cursor 1.2s step-end infinite` plus the
// `blink-cursor` keyframes in the registry globals.css). Embedded here so the
// port is self-contained without touching the site's Tailwind theme (same
// approach as Marquee/Meteors).
const STYLE = `
@keyframes blink-cursor {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.animate-blink-cursor {
  animation: blink-cursor 1.2s step-end infinite;
}
`

// Upstream: `as?: MotionElementType` — the DOM tags motion/react exposes.
type MotionElementType =
  | 'article'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'li'
  | 'p'
  | 'section'
  | 'span'

interface TypingAnimationProps extends JSX.HTMLAttributes<HTMLElement> {
  children?: string
  words?: string[]
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  duration?: number
  typeSpeed?: number
  deleteSpeed?: number
  delay?: number
  pauseDelay?: number
  loop?: boolean
  as?: MotionElementType
  startOnView?: boolean
  showCursor?: boolean
  blinkCursor?: boolean
  cursorStyle?: 'line' | 'block' | 'underscore'
}

export function TypingAnimation(props: TypingAnimationProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'words',
    'class',
    'className',
    'duration',
    'typeSpeed',
    'deleteSpeed',
    'delay',
    'pauseDelay',
    'loop',
    'as',
    'startOnView',
    'showCursor',
    'blinkCursor',
    'cursorStyle',
  ])

  const [displayedText, setDisplayedText] = createSignal('')
  const [currentWordIndex, setCurrentWordIndex] = createSignal(0)
  const [currentCharIndex, setCurrentCharIndex] = createSignal(0)
  const [phase, setPhase] = createSignal<'typing' | 'pause' | 'deleting'>('typing')

  let el!: HTMLElement

  // Upstream: useInView(ref, { amount: 0.3, once: true }) — IntersectionObserver
  // that disconnects after the first intersection.
  const [isInView, setIsInView] = createSignal(false)
  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    onCleanup(() => observer.disconnect())
  })

  const wordsToAnimate = createMemo<string[]>(
    () => own.words ?? (own.children ? [own.children] : []),
  )
  const hasMultipleWords = () => wordsToAnimate().length > 1

  const typingSpeed = () => own.typeSpeed ?? own.duration ?? 100
  const deletingSpeed = () => own.deleteSpeed ?? typingSpeed() / 2

  const startOnView = () => own.startOnView ?? true
  const shouldStart = () => (startOnView() ? isInView() : true)

  const animationSourceKey = createMemo(() =>
    own.words ? own.words.join('\u0000') : (own.children ?? ''),
  )

  // Upstream: useEffect on [animationSourceKey] — reset the machine when the
  // animated text changes.
  createEffect(() => {
    animationSourceKey()
    setDisplayedText('')
    setCurrentWordIndex(0)
    setCurrentCharIndex(0)
    setPhase('typing')
  })

  // Upstream: the drive effect on [shouldStart, phase, currentCharIndex,
  // currentWordIndex, displayedText, wordsToAnimate, hasMultipleWords, loop,
  // typingSpeed, deletingSpeed, pauseDelay, delay] — one setTimeout step per
  // state change. Solid reads become accessor calls so the effect re-runs on
  // exactly the same dependency set; onCleanup clears the pending timeout
  // before each re-run.
  createEffect(() => {
    const start = shouldStart()
    const words = wordsToAnimate()
    const currentPhase = phase()
    const charIndex = currentCharIndex()
    const wordIndex = currentWordIndex()
    const displayed = displayedText()
    const multiWord = hasMultipleWords()
    const loop = own.loop ?? false
    const delay = own.delay ?? 0
    const pauseDelayValue = own.pauseDelay ?? 1000

    if (!(start && words.length > 0)) return

    const timeoutDelay =
      delay > 0 && displayed === ''
        ? delay
        : currentPhase === 'typing'
          ? typingSpeed()
          : currentPhase === 'deleting'
            ? deletingSpeed()
            : pauseDelayValue

    const timeout = setTimeout(() => {
      const currentWord = words[wordIndex] || ''
      const graphemes = Array.from(currentWord)

      switch (currentPhase) {
        case 'typing':
          if (charIndex < graphemes.length) {
            setDisplayedText(graphemes.slice(0, charIndex + 1).join(''))
            setCurrentCharIndex(charIndex + 1)
          } else {
            if (multiWord || loop) {
              const isLastWord = wordIndex === words.length - 1
              if (!isLastWord || loop) {
                setPhase('pause')
              }
            }
          }
          break

        case 'pause':
          setPhase('deleting')
          break

        case 'deleting':
          if (charIndex > 0) {
            setDisplayedText(graphemes.slice(0, charIndex - 1).join(''))
            setCurrentCharIndex(charIndex - 1)
          } else {
            const nextIndex = (wordIndex + 1) % words.length
            setCurrentWordIndex(nextIndex)
            setPhase('typing')
          }
          break
      }
    }, timeoutDelay)

    onCleanup(() => clearTimeout(timeout))
  })

  const currentWordGraphemes = createMemo(() =>
    Array.from(wordsToAnimate()[currentWordIndex()] || ''),
  )
  const isComplete = createMemo(
    () =>
      !(own.loop ?? false) &&
      currentWordIndex() === wordsToAnimate().length - 1 &&
      currentCharIndex() >= currentWordGraphemes().length &&
      phase() !== 'deleting',
  )
  const shouldShowCursor = createMemo(
    () =>
      (own.showCursor ?? true) &&
      !isComplete() &&
      (hasMultipleWords() ||
        (own.loop ?? false) ||
        currentCharIndex() < currentWordGraphemes().length),
  )

  const getCursorChar = () => {
    switch (own.cursorStyle ?? 'line') {
      case 'block':
        return '▌'
      case 'underscore':
        return '_'
      case 'line':
      default:
        return '|'
    }
  }

  // Upstream renders a motion component (the polymorphic `as` tag); motion is
  // only used as the element wrapper — no motion props are passed through — so
  // a plain `Dynamic` element keeps identical behavior.
  const component = () => own.as ?? 'span'

  return (
    <>
      <style>{STYLE}</style>
      <Dynamic
        component={component()}
        ref={el}
        class={`leading-20 tracking-[-0.02em] ${component() === 'span' ? 'inline-block' : ''} ${own.class ?? ''} ${own.className ?? ''}`}
        {...rest}
      >
        {displayedText()}
        {shouldShowCursor() && (
          <span class={`inline-block ${(own.blinkCursor ?? true) ? 'animate-blink-cursor' : ''}`}>
            {getCursorChar()}
          </span>
        )}
      </Dynamic>
    </>
  )
}

export default TypingAnimation
