// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/neon-gradient-card.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

interface NeonColorsProps {
  firstColor: string
  secondColor: string
}

interface NeonGradientCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * The component to be rendered as the card.
   * PORT-NOTE: upstream declares this prop but its implementation ignores it
   * (the card always renders a `div`); kept for public-API parity, also unused.
   */
  as?: JSX.Element
  /**
   * The className of the card.
   */
  className?: string
  /**
   * The size of the border in pixels.
   * @default 2
   */
  borderSize?: number
  /**
   * The size of the radius in pixels.
   * @default 20
   */
  borderRadius?: number
  /**
   * The colors of the neon gradient.
   * @default { firstColor: '#ff00aa', secondColor: '#00FFF1' }
   */
  neonColors?: NeonColorsProps
}

// Upstream relies on the registry's Tailwind theme entry
// (`--animate-background-position-spin` plus the `background-position-spin`
// keyframes in the registry globals.css). They are embedded here so the port
// is self-contained, mirroring the ShimmerButton/AnimatedShinyText ports.
const STYLE = `
@keyframes background-position-spin {
  0% {
    background-position: top center;
  }
  100% {
    background-position: bottom center;
  }
}
.animate-background-position-spin {
  animation: background-position-spin 3000ms infinite alternate;
}
`

export function NeonGradientCard(props: NeonGradientCardProps) {
  const [own, rest] = splitProps(props, [
    'class',
    'className',
    'borderSize',
    'borderRadius',
    'neonColors',
  ])

  const borderSize = () => own.borderSize ?? 2
  const borderRadius = () => own.borderRadius ?? 20
  const neonColors = () => own.neonColors ?? { firstColor: '#ff00aa', secondColor: '#00FFF1' }

  let containerRef!: HTMLDivElement
  const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 })

  // Upstream: useEffect([]) — measure + window resize listener.
  onMount(() => {
    const updateDimensions = () => {
      setDimensions({ width: containerRef.offsetWidth, height: containerRef.offsetHeight })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    onCleanup(() => window.removeEventListener('resize', updateDimensions))
  })

  // Upstream: useEffect([children]) — re-measure when the content changes.
  createEffect(() => {
    void props.children
    setDimensions({ width: containerRef.offsetWidth, height: containerRef.offsetHeight })
  })

  return (
    <div
      ref={containerRef}
      style={{
        '--border-size': `${borderSize()}px`,
        '--border-radius': `${borderRadius()}px`,
        '--neon-first-color': neonColors().firstColor,
        '--neon-second-color': neonColors().secondColor,
        '--card-width': `${dimensions().width}px`,
        '--card-height': `${dimensions().height}px`,
        '--card-content-radius': `${borderRadius() - borderSize()}px`,
        '--pseudo-element-background-image': `linear-gradient(0deg, ${neonColors().firstColor}, ${neonColors().secondColor})`,
        '--pseudo-element-width': `${dimensions().width + borderSize() * 2}px`,
        '--pseudo-element-height': `${dimensions().height + borderSize() * 2}px`,
        '--after-blur': `${dimensions().width / 3}px`,
      }}
      class={`relative z-10 size-full rounded-(--border-radius) ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    >
      <style>{STYLE}</style>
      <div
        class={`relative size-full min-h-[inherit] rounded-(--card-content-radius) bg-gray-100 p-6
          before:absolute before:-top-(--border-size) before:-left-(--border-size) before:-z-10 before:block
          before:h-(--pseudo-element-height) before:w-(--pseudo-element-width) before:rounded-(--border-radius) before:content-['']
          before:bg-[linear-gradient(0deg,var(--neon-first-color),var(--neon-second-color))] before:bg-size-[100%_200%]
          before:animate-background-position-spin
          after:absolute after:-top-(--border-size) after:-left-(--border-size) after:-z-10 after:block
          after:h-(--pseudo-element-height) after:w-(--pseudo-element-width) after:rounded-(--border-radius) after:blur-(--after-blur) after:content-['']
          after:bg-[linear-gradient(0deg,var(--neon-first-color),var(--neon-second-color))] after:bg-size-[100%_200%] after:opacity-80
          after:animate-background-position-spin
          dark:bg-neutral-900
          wrap-break-word`}
      >
        {props.children}
      </div>
    </div>
  )
}

export default NeonGradientCard
