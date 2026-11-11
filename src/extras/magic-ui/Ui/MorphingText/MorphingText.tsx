// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/morphing-text.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { onCleanup, onMount, splitProps } from 'solid-js'

interface MorphingTextProps {
  texts: string[]
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
}

const morphTime = 1.5
const cooldownTime = 0.5

/**
 * MorphingText
 *
 * Cross-fades/blurs between words on a rAF clock, via an SVG threshold filter.
 *
 * PORT-NOTE: upstream splits this into `useMorphingText` + `Texts` +
 * `SvgFilters` components; the Solid port inlines the two stateless wrappers
 * to keep a single component (structure of the rAF clock is unchanged). The
 * `#threshold` filter id is global exactly as upstream ships it — mounting
 * multiple instances on one page is unsupported upstream too.
 */
export const MorphingText = (props: MorphingTextProps) => {
  const [own, rest] = splitProps(props, ['texts', 'class', 'className'])

  let text1Ref!: HTMLSpanElement
  let text2Ref!: HTMLSpanElement
  let rafId: number | null = null

  // Upstream keeps these in refs; the component body runs once per instance
  // in Solid, so plain closure variables carry the same state.
  let textIndex = 0
  let morph = 0
  let cooldown = 0
  let lastTime = new Date()

  const setStyles = (fraction: number) => {
    if (!text1Ref || !text2Ref) return

    text2Ref.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`
    text2Ref.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`

    const invertedFraction = 1 - fraction
    text1Ref.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`
    text1Ref.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`

    text1Ref.textContent = own.texts[textIndex % own.texts.length] ?? ''
    text2Ref.textContent = own.texts[(textIndex + 1) % own.texts.length] ?? ''
  }

  const doMorph = () => {
    morph -= cooldown
    cooldown = 0

    let fraction = morph / morphTime

    if (fraction > 1) {
      cooldown = cooldownTime
      fraction = 1
    }

    setStyles(fraction)

    if (fraction === 1) {
      textIndex++
    }
  }

  const doCooldown = () => {
    morph = 0
    if (text1Ref && text2Ref) {
      text2Ref.style.filter = 'none'
      text2Ref.style.opacity = '100%'
      text1Ref.style.filter = 'none'
      text1Ref.style.opacity = '0%'
    }
  }

  const animate = () => {
    rafId = requestAnimationFrame(animate)

    const newTime = new Date()
    const dt = (newTime.getTime() - lastTime.getTime()) / 1000
    lastTime = newTime

    cooldown -= dt

    if (cooldown <= 0) doMorph()
    else doCooldown()
  }

  // Upstream: useEffect([doMorph, doCooldown]) — restarts the clock when
  // `texts` changes so the new list lands in the closure. Solid reads
  // `own.texts` live inside the frame callback, so a changed list applies
  // immediately without restarting the loop (same observable result).
  onMount(() => {
    rafId = requestAnimationFrame(animate)
    onCleanup(() => {
      if (rafId !== null) cancelAnimationFrame(rafId)
    })
  })

  return (
    <div
      class={`relative mx-auto h-16 w-full max-w-3xl text-center font-sans text-[40pt] leading-none font-bold filter-[url(#threshold)_blur(0.6px)] md:h-24 lg:text-[6rem] ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    >
      <span class="absolute inset-x-0 top-0 m-auto inline-block w-full" ref={text1Ref} />
      <span class="absolute inset-x-0 top-0 m-auto inline-block w-full" ref={text2Ref} />
      <svg id="filters" class="fixed h-0 w-0" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>
    </div>
  )
}

export default MorphingText
