import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { animate, motionValue } from 'motion'
import type {
  AnimationPlaybackControls,
  MotionValue,
  Target,
  TargetAndTransition,
  Transition,
} from 'motion'
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

const segmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('en', { granularity: 'grapheme' })
    : null

const splitIntoCharacters = (text: string): string[] =>
  segmenter ? Array.from(segmenter.segment(text), segment => segment.segment) : Array.from(text)

const withFilter = <T,>(state: T, filter: string): T =>
  state && typeof state === 'object' && !Array.isArray(state) ? ({ ...state, filter } as T) : state

export type RotatingTextEffect = 'slide' | 'flip' | 'blur' | 'scale' | 'drop'

export interface RotatingTextRef {
  next: () => void
  previous: () => void
  jumpTo: (index: number) => void
  reset: () => void
}

export interface RotatingTextProps {
  texts: string[]
  transition?: Transition
  initial?: boolean | Target
  animate?: boolean | TargetAndTransition
  exit?: Target
  effect?: RotatingTextEffect
  direction?: 'up' | 'down'
  highlight?: boolean
  highlightColor?: string
  animatePresenceMode?: 'sync' | 'wait'
  animatePresenceInitial?: boolean
  rotationInterval?: number
  staggerDuration?: number
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number
  loop?: boolean
  auto?: boolean
  pauseOnHover?: boolean
  blur?: number
  splitBy?: string
  onNext?: (index: number) => void
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  mainClassName?: string
  splitLevelClassName?: string
  elementLevelClassName?: string
  className?: string
  class?: string
  style?: JSX.CSSProperties
  /** Upstream exposed an imperative handle via forwardRef; pass a callback. */
  ref?: (handle: RotatingTextRef) => void
}

interface EffectPreset {
  initial: Target
  animate: Target
  exit: Target
  transition: Transition
  exitTransition?: Transition
}

interface WordElement {
  characters: string[]
  needsSpace: boolean
}

interface StaggerOrder {
  total: number
  shuffled: number[]
}

interface ExitingText {
  id: number
  index: number
}

/** Layout box snapshot for the FLIP reproduction of upstream's `layout` prop. */
interface Box {
  w: number
  h: number
  x: number
  y: number
}

const FLIP_EPSILON = 0.5

// offset* metrics ignore transforms, so mid-flight measurements stay stable.
const boxOf = (el: HTMLElement): Box => ({
  w: el.offsetWidth,
  h: el.offsetHeight,
  x: el.offsetLeft,
  y: el.offsetTop,
})

const LAYOUT_SPRING: Transition = { type: 'spring', damping: 25, stiffness: 300 }
const WIDTH_SPRING: Transition = { type: 'spring', damping: 34, stiffness: 320 }
// Upstream MotionConfig reducedMotion="user" disables these (transform) values
// only — opacity/filter keep animating.
const TRANSFORM_KEYS = new Set([
  'x',
  'y',
  'z',
  'translateX',
  'translateY',
  'translateZ',
  'scale',
  'scaleX',
  'scaleY',
  'scaleZ',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'skew',
  'skewX',
  'skewY',
  'transformPerspective',
])

const splitReducedKeyframes = <V,>(
  keyframes: Record<string, V>,
): [Record<string, V>, Record<string, V>] => {
  const transforms: Record<string, V> = {}
  const rest: Record<string, V> = {}
  for (const key of Object.keys(keyframes)) {
    ;(TRANSFORM_KEYS.has(key) ? transforms : rest)[key] = keyframes[key]
  }
  return [transforms, rest]
}
const FLIP_STYLE: JSX.CSSProperties = {
  'transform-origin': '50% 50% -0.45em',
  'backface-visibility': 'hidden',
}

const EFFECTS: Record<RotatingTextEffect, (up: boolean) => EffectPreset> = {
  slide: up => ({
    initial: { y: up ? '100%' : '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: up ? '-120%' : '120%', opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  }),
  flip: up => ({
    initial: { rotateX: up ? -90 : 90, opacity: 0, transformPerspective: 480 },
    animate: { rotateX: 0, opacity: 1, transformPerspective: 480 },
    exit: { rotateX: up ? 90 : -90, opacity: 0, transformPerspective: 480 },
    transition: { type: 'tween', duration: 0.6, ease: [0.34, 1.4, 0.64, 1] },
    exitTransition: { type: 'tween', duration: 0.32, ease: [0.5, 0, 0.75, 0] },
  }),
  blur: up => ({
    initial: { y: up ? '45%' : '-45%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: up ? '-45%' : '45%', opacity: 0 },
    transition: { type: 'tween', duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
  scale: up => ({
    initial: { scale: up ? 0.35 : 1.7, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: up ? 1.7 : 0.35, opacity: 0 },
    transition: { type: 'spring', damping: 17, stiffness: 240 },
  }),
  drop: () => ({
    initial: { y: '-110%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '110%', opacity: 0 },
    transition: { type: 'spring', damping: 18, stiffness: 320, mass: 0.9 },
    exitTransition: { type: 'tween', duration: 0.3, ease: [0.55, 0, 1, 0.45] },
  }),
}

const readableText = (color: string): string | undefined => {
  const value = String(color ?? '').trim()
  let rgb: number[] | null = null
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)
  if (hex) {
    const digits =
      hex[1].length < 6 ? [...hex[1].slice(0, 3)].map(c => c + c).join('') : hex[1].slice(0, 6)
    rgb = [0, 2, 4].map(i => parseInt(digits.slice(i, i + 2), 16))
  } else {
    const fn = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (fn) rgb = fn.slice(1, 4).map(Number)
  }
  if (!rgb) return undefined
  const [r, g, b] = rgb.map(channel => {
    const c = Math.min(Math.max(channel / 255, 0), 1)
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? '#0b0b0c' : '#ffffff'
}

const RotatingText = (props: RotatingTextProps) => {
  const [currentTextIndex, setCurrentTextIndex] = createSignal(0)
  const [hovered, setHovered] = createSignal(false)
  // Index of the text currently in the DOM (upstream AnimatePresence child).
  const [shownIndex, setShownIndex] = createSignal(0)
  let index = 0
  let rootEl!: HTMLSpanElement
  let contentEl: HTMLSpanElement | null = null
  let presenceEl: HTMLSpanElement | null = null
  const charEls: (HTMLSpanElement | null)[] = []
  let enteredOnce = false
  let widthAuto = true

  // FLIP state reproducing upstream's `layout={!highlight}` (LAYOUT_SPRING).
  let flipControls: AnimationPlaybackControls | null = null
  let flipPrev: { root: Box; presence: Box | null } | null = null

  // AnimatePresence mode="sync": outgoing texts render as absolutely
  // positioned overlays while the next text enters concurrently.
  const [exitingItems, setExitingItems] = createSignal<ExitingText[]>([])
  let overlaySeq = 0
  const overlayElsById = new Map<number, (HTMLSpanElement | null)[]>()
  const overlayControls = new Set<AnimationPlaybackControls>()

  const reduceMotion = usePrefersReducedMotion()

  const texts = () => props.texts
  const lastIndex = () => Math.max(texts().length - 1, 0)
  const activeIndex = () => Math.min(currentTextIndex(), lastIndex())
  const splitBy = () => props.splitBy ?? 'characters'

  const elementsFor = (index: number): WordElement[] => {
    const currentText: string = texts()[index] ?? ''
    if (splitBy() === 'characters') {
      const words = currentText.split(' ')
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }))
    }
    if (splitBy() === 'words') {
      return currentText.split(' ').map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1,
      }))
    }
    if (splitBy() === 'lines') {
      return currentText.split('\n').map((line, i, arr) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1,
      }))
    }
    return currentText.split(splitBy()).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1,
    }))
  }

  const elements = createMemo(() => elementsFor(shownIndex()))

  const orderFor = (list: WordElement[]): StaggerOrder => {
    const total = list.reduce((sum, word) => sum + word.characters.length, 0)
    const shuffled = Array.from({ length: total }, (_, i) => i).sort(() => Math.random() - 0.5)
    return { total, shuffled }
  }

  const order = createMemo(() => orderFor(elements()))

  const delayFor = (ord: StaggerOrder, charIndex: number): number => {
    const { total, shuffled } = ord
    const staggerDuration = props.staggerDuration ?? 0
    const staggerFrom = props.staggerFrom ?? 'first'
    if (staggerFrom === 'first') return charIndex * staggerDuration
    if (staggerFrom === 'last') return (total - 1 - charIndex) * staggerDuration
    if (staggerFrom === 'center')
      return Math.abs(Math.floor(total / 2) - charIndex) * staggerDuration
    if (staggerFrom === 'random') return shuffled[charIndex] * staggerDuration
    return Math.abs(staggerFrom - charIndex) * staggerDuration
  }

  const getStaggerDelay = (charIndex: number): number => delayFor(order(), charIndex)

  const goTo = (next: number) => {
    if (next === index) return
    index = next
    setCurrentTextIndex(next)
    untrack(() => props.onNext?.(next))
  }

  const next = () => {
    const current = Math.min(index, lastIndex())
    goTo(current < lastIndex() ? current + 1 : (props.loop ?? true) ? 0 : current)
  }
  const previous = () => {
    const current = Math.min(index, lastIndex())
    goTo(current > 0 ? current - 1 : (props.loop ?? true) ? lastIndex() : current)
  }
  const jumpTo = (target: number) => goTo(Math.max(0, Math.min(target, lastIndex())))
  const reset = () => goTo(0)

  onMount(() => props.ref?.({ next, previous, jumpTo, reset }))

  const paused = () => (props.pauseOnHover ?? false) && hovered()

  createEffect(() => {
    // Upstream deps: [next, rotationInterval, auto, paused, activeIndex]
    const auto = props.auto ?? true
    const isPaused = paused()
    const interval = props.rotationInterval ?? 2000
    const current = activeIndex()
    void current
    if (!auto || isPaused) return
    const timeoutId = setTimeout(next, interval)
    onCleanup(() => clearTimeout(timeoutId))
  })

  // Width tween of the highlight pill (upstream layout width MotionValue).
  const width: MotionValue<number> = motionValue(0)
  const applyWidth = (value: string | number) => {
    if (rootEl) rootEl.style.width = typeof value === 'number' ? `${value}px` : value
  }
  onMount(() => {
    applyWidth(widthAuto ? 'auto' : width.get())
    const off = width.on('change', value => {
      widthAuto = false
      applyWidth(value)
    })
    onCleanup(off)
  })

  createEffect(() => {
    // Upstream deps: [highlight, reduceMotion, width]
    const highlight = props.highlight ?? false
    const reduce = reduceMotion()
    if (!highlight || !contentEl) {
      widthAuto = true
      applyWidth('auto')
      return
    }
    const content = contentEl
    let controls: AnimationPlaybackControls | null = null
    let settled = false
    const fit = () => {
      const target = content.offsetWidth + 1
      controls?.stop()
      if (!settled || reduce) {
        settled = true
        widthAuto = false
        width.set(target)
        return
      }
      controls = animate(width, target, WIDTH_SPRING)
    }
    fit()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    observer?.observe(content)
    onCleanup(() => {
      observer?.disconnect()
      controls?.stop()
    })
  })

  // FLIP reproduction of upstream's `layout={!highlight}`: measure the root
  // (and presence) layout boxes before the swap commit, measure again after,
  // and animate the delta with the same LAYOUT_SPRING / transition prop.
  // The root box covers shrink-to-fit contexts (scale + translate morph); the
  // presence box covers full-width roots; one or the other, never both —
  // scaling both would compound the distortion.
  const stopFlip = () => {
    flipControls?.stop()
    flipControls = null
    rootEl.style.transform = ''
    if (presenceEl) presenceEl.style.transform = ''
  }
  onCleanup(stopFlip)

  const captureFlip = () => {
    if (highlight()) return
    stopFlip()
    flipPrev = { root: boxOf(rootEl), presence: presenceEl ? boxOf(presenceEl) : null }
  }

  const applyFlip = () => {
    const prev = flipPrev
    flipPrev = null
    if (!prev || highlight() || reduceMotion()) return
    const spring = props.transition ?? LAYOUT_SPRING
    const morph = (el: HTMLSpanElement, from: Box, to: Box) => {
      const keyframes: Record<string, number[]> = {}
      if (Math.abs(to.x - from.x) > FLIP_EPSILON) keyframes.x = [from.x - to.x, 0]
      if (Math.abs(to.y - from.y) > FLIP_EPSILON) keyframes.y = [from.y - to.y, 0]
      if (Math.abs(to.w - from.w) > FLIP_EPSILON && to.w > 0) keyframes.scaleX = [from.w / to.w, 1]
      if (Math.abs(to.h - from.h) > FLIP_EPSILON && to.h > 0) keyframes.scaleY = [from.h / to.h, 1]
      if (Object.keys(keyframes).length === 0) return null
      el.style.setProperty('transform-origin', '0 0')
      const controls = animate(el, keyframes, {
        ...spring,
        onComplete: () => {
          if (flipControls === controls) flipControls = null
          el.style.transform = ''
        },
      })
      return controls
    }
    const rootBox = boxOf(rootEl)
    const rootChanged =
      Math.abs(rootBox.x - prev.root.x) > FLIP_EPSILON ||
      Math.abs(rootBox.y - prev.root.y) > FLIP_EPSILON ||
      Math.abs(rootBox.w - prev.root.w) > FLIP_EPSILON ||
      Math.abs(rootBox.h - prev.root.h) > FLIP_EPSILON
    if (rootChanged) {
      flipControls = morph(rootEl, prev.root, rootBox)
      return
    }
    if (prev.presence && presenceEl) {
      flipControls = morph(presenceEl, prev.presence, boxOf(presenceEl))
    }
  }

  const liveChars = () => charEls.filter((el): el is HTMLSpanElement => Boolean(el))

  // Shared exit half of AnimatePresence: animate each char toward its leave
  // state with its stagger delay. Used by both presence modes.
  const animateCharsOut = (
    els: (HTMLSpanElement | null)[],
    delayOf: (charIndex: number) => number,
  ): AnimationPlaybackControls[] => {
    const leave = leaveTo()
    const reduce = reduceMotion()
    return els
      .filter((el): el is HTMLSpanElement => Boolean(el))
      .flatMap((el, i) => {
        const delay = delayOf(i)
        const base: Transition = exitTransition()
          ? { ...(exitTransition() as Transition), delay }
          : { ...charTransition(), delay }
        if (reduce) {
          // Upstream MotionConfig reducedMotion="user": transforms jump to
          // their exit value; opacity/filter still animate on the transition.
          const [transforms, rest] = splitReducedKeyframes(leave as Record<
            string,
            string | number
          >)
          return [
            ...(Object.keys(transforms).length
              ? [animate(el, transforms, { duration: 0, delay })]
              : []),
            ...(Object.keys(rest).length ? [animate(el, rest, base)] : []),
          ]
        }
        return [animate(el, leave, base)]
      })
  }

  // Swap driver. animatePresenceMode "wait" (upstream default): animate the
  // mounted chars out, then swap the shown text so the enter effect mounts +
  // animates the next one. "sync": swap immediately, keep the outgoing text as
  // an absolutely positioned overlay, and run its exit animation concurrently
  // with the incoming enter animation (upstream keeps multiple exiting
  // children, so rapid swaps stack overlays until each exit completes).
  createEffect(() => {
    const target = activeIndex()
    const current = shownIndex()
    if (target === current) return
    captureFlip()
    if ((props.animatePresenceMode ?? 'wait') === 'sync') {
      const ord = order()
      const id = ++overlaySeq
      overlayElsById.set(id, [])
      setExitingItems(list => [...list, { id, index: current }])
      setShownIndex(target)
      queueMicrotask(() => {
        const controls = animateCharsOut(overlayElsById.get(id) ?? [], i => delayFor(ord, i))
        controls.forEach(control => overlayControls.add(control))
        void Promise.all(controls.map(control => control.then(() => undefined))).then(() => {
          controls.forEach(control => overlayControls.delete(control))
          overlayElsById.delete(id)
          setExitingItems(list => list.filter(item => item.id !== id))
        })
      })
      onCleanup(() => overlayElsById.delete(id))
      return
    }
    const controls = animateCharsOut(liveChars(), getStaggerDelay)
    let stopped = false
    void Promise.all(controls.map(control => control.then(() => undefined))).then(() => {
      if (!stopped) setShownIndex(target)
    })
    onCleanup(() => {
      stopped = true
      controls.forEach(control => control.stop())
    })
  })

  // Enter half: chars mount with shownIndex's For, then animate from
  // enterFrom to enterTo with their stagger delay.
  createEffect(() => {
    const current = shownIndex()
    const list = elements()
    void list
    const els = liveChars()
    // DOM for the swapped-in text is committed here — measure + FLIP the box.
    applyFlip()
    const from = enterFrom()
    const to = enterTo()
    const reduce = reduceMotion()
    const firstMount = !enteredOnce
    enteredOnce = true
    const controls = els.flatMap((el, i) => {
      if (firstMount && !(props.animatePresenceInitial ?? false)) {
        return [animate(el, to, { duration: 0 })]
      }
      const fromValues = from as Record<string, string | number>
      const toValues = to as Record<string, string | number>
      const keyframes: Record<string, (string | number)[]> = {}
      for (const key of new Set([...Object.keys(fromValues), ...Object.keys(toValues)])) {
        keyframes[key] = [
          fromValues[key] ??
            (toValues[key] === '0' || typeof toValues[key] === 'number' ? 0 : toValues[key]),
          toValues[key],
        ]
      }
      const delay = getStaggerDelay(i)
      if (reduce) {
        // Upstream MotionConfig reducedMotion="user": transforms jump to their
        // target; opacity/filter still animate on the normal transition.
        const [transforms, rest] = splitReducedKeyframes(keyframes)
        return [
          ...(Object.keys(transforms).length
            ? [animate(el, transforms, { duration: 0, delay })]
            : []),
          ...(Object.keys(rest).length ? [animate(el, rest, { ...charTransition(), delay })] : []),
        ]
      }
      return [animate(el, keyframes, { ...charTransition(), delay })]
    })
    void current
    onCleanup(() => controls.forEach(control => control.stop()))
  })

  const handleMouseEnter = (event: MouseEvent) => {
    if (props.pauseOnHover ?? false) setHovered(true)
    props.onMouseEnter?.(event)
  }

  const handleMouseLeave = (event: MouseEvent) => {
    setHovered(false)
    props.onMouseLeave?.(event)
  }

  const effect = () => props.effect ?? 'slide'
  const direction = () => props.direction ?? 'up'
  const highlight = () => props.highlight ?? false
  const blurAmount = () => {
    const value = props.blur ?? 0
    return value > 0 ? value : effect() === 'blur' ? 10 : 0
  }

  const preset = createMemo<EffectPreset>(() =>
    (EFFECTS[effect()] ?? EFFECTS.slide)(direction() !== 'down'),
  )
  const enterFrom = createMemo<Target>(() => {
    const base =
      props.initial && typeof props.initial === 'object' ? props.initial : preset().initial
    return blurAmount() > 0 ? withFilter(base, `blur(${blurAmount()}px)`) : base
  })
  const enterTo = createMemo<Target>(() => {
    const base =
      props.animate && typeof props.animate === 'object' ? props.animate : preset().animate
    return blurAmount() > 0 ? withFilter(base, 'blur(0px)') : base
  })
  const leaveTo = createMemo<Target>(() => {
    const base = props.exit && typeof props.exit === 'object' ? props.exit : preset().exit
    return blurAmount() > 0 ? withFilter(base, `blur(${blurAmount()}px)`) : base
  })
  const charTransition = createMemo<Transition>(() => props.transition ?? preset().transition)
  const exitTransition = createMemo<Transition | null>(() =>
    props.transition || props.exit ? null : (preset().exitTransition ?? null),
  )
  const charStyle = () => (effect() === 'flip' ? FLIP_STYLE : undefined)

  const blockStyle = createMemo<JSX.CSSProperties>(() => {
    const base = props.style ?? {}
    if (!highlight()) return base
    const highlightColor = props.highlightColor ?? '#a855f7'
    return {
      ...base,
      'background-color': highlightColor,
      color: readableText(highlightColor) ?? (props.style as { color?: string } | undefined)?.color,
    }
  })

  const presenceClass = () =>
    splitBy() === 'lines' ? 'flex flex-col w-full' : 'flex flex-wrap whitespace-pre-wrap relative'

  const renderChars = (list: WordElement[], els?: (HTMLSpanElement | null)[]) => (
    <For each={list}>
      {(wordObj, wordIndex) => {
        const previousCharsCount = () =>
          list.slice(0, wordIndex()).reduce((sum, word) => sum + word.characters.length, 0)
        return (
          <span class={`inline-flex ${props.splitLevelClassName ?? ''}`}>
            <For each={wordObj.characters}>
              {(char, charIndex) => (
                <span
                  ref={(el: HTMLSpanElement) => {
                    if (els) {
                      els[previousCharsCount() + charIndex()] = el
                      return
                    }
                    charEls[previousCharsCount() + charIndex()] = el
                    onCleanup(() => {
                      if (charEls[previousCharsCount() + charIndex()] === el) {
                        charEls[previousCharsCount() + charIndex()] = null
                      }
                    })
                  }}
                  class={`inline-block ${props.elementLevelClassName ?? ''}`}
                  style={charStyle()}
                >
                  {char}
                </span>
              )}
            </For>
            <Show when={wordObj.needsSpace}>
              <span class="whitespace-pre"> </span>
            </Show>
          </span>
        )
      }}
    </For>
  )

  const presence = () => (
    <span
      ref={(el: HTMLSpanElement) => {
        presenceEl = el
      }}
      class={presenceClass()}
      aria-hidden="true"
    >
      {renderChars(elements())}
    </span>
  )

  return (
    <span
      ref={rootEl}
      class={[
        'flex whitespace-pre-wrap relative',
        highlight()
          ? 'box-content flex-nowrap justify-center overflow-hidden px-[0.28em] py-[0.1em] rounded-[0.16em]'
          : 'flex-wrap',
        props.mainClassName ?? '',
        props.class ?? '',
        props.className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={blockStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span class="sr-only">{texts()[activeIndex()] ?? ''}</span>
      <Show when={highlight()} fallback={presence()}>
        <span ref={(el: HTMLSpanElement) => (contentEl = el)} class="flex shrink-0 whitespace-pre">
          {presence()}
        </span>
      </Show>
      <For each={exitingItems()}>
        {item => (
          <span
            class={presenceClass()}
            style={
              highlight()
                ? { position: 'absolute', top: '0.1em', left: '0.28em' }
                : { position: 'absolute', top: '0', left: '0' }
            }
            aria-hidden="true"
          >
            {renderChars(elementsFor(item.index), overlayElsById.get(item.id))}
          </span>
        )}
      </For>
    </span>
  )
}

export default RotatingText
