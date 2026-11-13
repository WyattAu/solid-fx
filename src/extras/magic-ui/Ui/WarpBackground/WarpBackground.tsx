// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/warp-background.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import { createMemo, For, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

// PORT-NOTE: upstream drives each beam with motion/react
// (`initial y:100cqmax → animate y:-100%`, `repeat: Infinity, ease: linear`,
// per-beam duration + delay). The vanilla `motion` engine cannot reliably
// interpolate the `cqmax → %` unit jump on the same transform, so the identical
// animation is emitted as CSS keyframes — same visual result, disposal-free
// (element removal stops the animation). Same approach as AnimatedGradientText.
const STYLE = `
@keyframes warp-beam {
  from {
    transform: translateY(100cqmax) translateX(-50%);
  }
  to {
    transform: translateY(-100%) translateX(-50%);
  }
}
.warp-beam {
  animation-name: warp-beam;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
`

type BeamVars = JSX.CSSProperties & {
  '--x': string
  '--width': string
  '--aspect-ratio': string
  '--background': string
}

type ContainerVars = JSX.CSSProperties & {
  '--perspective': string
  '--grid-color': string
  '--beam-size': string
}

interface WarpBackgroundProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  children: JSX.Element
  perspective?: number
  beamsPerSide?: number
  beamSize?: number
  beamDelayMax?: number
  beamDelayMin?: number
  beamDuration?: number
  gridColor?: string
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  style?: JSX.CSSProperties
}

const Beam = (props: {
  width: string | number
  x: string | number
  delay: number
  duration: number
}) => {
  const hue = Math.floor(Math.random() * 360)
  const ar = Math.floor(Math.random() * 10) + 1

  return (
    <div
      class="warp-beam absolute top-0 left-(--x) aspect-[1/var(--aspect-ratio)] w-(--width) [background:var(--background)]"
      style={
        {
          '--x': `${props.x}`,
          '--width': `${props.width}`,
          '--aspect-ratio': `${ar}`,
          '--background': `linear-gradient(hsl(${hue} 80% 60%), transparent)`,
          'animation-duration': `${props.duration}s`,
          'animation-delay': `${props.delay}s`,
        } as BeamVars
      }
    />
  )
}

export function WarpBackground(props: WarpBackgroundProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'perspective',
    'beamsPerSide',
    'beamSize',
    'beamDelayMax',
    'beamDelayMin',
    'beamDuration',
    'gridColor',
    'class',
    'className',
    'style',
  ])

  const perspective = () => own.perspective ?? 100
  const beamsPerSide = () => own.beamsPerSide ?? 3
  const beamSize = () => own.beamSize ?? 5
  const beamDelayMax = () => own.beamDelayMax ?? 3
  const beamDelayMin = () => own.beamDelayMin ?? 0
  const beamDuration = () => own.beamDuration ?? 3
  const gridColor = () => own.gridColor ?? 'var(--border)'

  const generateBeams = () => {
    const beams: Array<{ x: number; delay: number }> = []
    const cellsPerSide = Math.floor(100 / beamSize())
    const step = cellsPerSide / beamsPerSide()

    for (let i = 0; i < beamsPerSide(); i++) {
      const x = Math.floor(i * step)
      const delay =
        Math.random() * (beamDelayMax() - beamDelayMin()) + beamDelayMin()
      beams.push({ x, delay })
    }
    return beams
  }

  const topBeams = createMemo(generateBeams)
  const rightBeams = createMemo(generateBeams)
  const bottomBeams = createMemo(generateBeams)
  const leftBeams = createMemo(generateBeams)

  return (
    <>
      <style>{STYLE}</style>
      <div
        class={`relative rounded border p-20 ${own.class ?? ''} ${own.className ?? ''}`}
        style={own.style}
        {...rest}
      >
        <div
          style={
            {
              '--perspective': `${perspective()}px`,
              '--grid-color': gridColor(),
              '--beam-size': `${beamSize()}%`,
            } as ContainerVars
          }
          class="@container-[size] pointer-events-none absolute top-0 left-0 size-full overflow-hidden [clipPath:inset(0)] perspective-(--perspective) transform-3d"
        >
          {/* top side */}
          <div class="@container absolute z-20 h-[100cqmax] w-[100cqi] origin-[50%_0%] transform-[rotateX(-90deg)] bg-size-[var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] transform-3d">
            <For each={topBeams()}>
              {(beam) => (
                <Beam
                  width={`${beamSize()}%`}
                  x={`${beam.x * beamSize()}%`}
                  delay={beam.delay}
                  duration={beamDuration()}
                />
              )}
            </For>
          </div>
          {/* bottom side */}
          <div class="@container absolute top-full h-[100cqmax] w-[100cqi] origin-[50%_0%] transform-[rotateX(-90deg)] bg-size-[var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] transform-3d">
            <For each={bottomBeams()}>
              {(beam) => (
                <Beam
                  width={`${beamSize()}%`}
                  x={`${beam.x * beamSize()}%`}
                  delay={beam.delay}
                  duration={beamDuration()}
                />
              )}
            </For>
          </div>
          {/* left side */}
          <div class="@container absolute top-0 left-0 h-[100cqmax] w-[100cqh] origin-[0%_0%] transform-[rotate(90deg)_rotateX(-90deg)] bg-size-[var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] transform-3d">
            <For each={leftBeams()}>
              {(beam) => (
                <Beam
                  width={`${beamSize()}%`}
                  x={`${beam.x * beamSize()}%`}
                  delay={beam.delay}
                  duration={beamDuration()}
                />
              )}
            </For>
          </div>
          {/* right side */}
          <div class="@container absolute top-0 right-0 h-[100cqmax] w-[100cqh] origin-[100%_0%] transform-[rotate(-90deg)_rotateX(-90deg)] bg-size-[var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] transform-3d">
            <For each={rightBeams()}>
              {(beam) => (
                <Beam
                  width={`${beamSize()}%`}
                  x={`${beam.x * beamSize()}%`}
                  delay={beam.delay}
                  duration={beamDuration()}
                />
              )}
            </For>
          </div>
        </div>
        <div class="relative">{own.children}</div>
      </div>
    </>
  )
}

export default WarpBackground
