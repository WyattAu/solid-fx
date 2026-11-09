// Source: github.com/codse/animata animata/card/flip-card.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import { createContext, createMemo, splitProps, useContext } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

export type FlipCardRotate = 'x' | 'y'

type FlipCardContextValue = {
  rotate: FlipCardRotate
}

// PORT-NOTE: upstream provides the context value via useMemo; the Solid port provides
// an accessor so Face components stay reactive to `rotate` changes.
const FlipCardContext = createContext<Accessor<FlipCardContextValue> | null>(null)

const ROTATION_CLASS = {
  x: {
    hover: 'group-hover/card:rotate-x-180',
    back: 'rotate-x-180',
  },
  y: {
    hover: 'group-hover/card:rotate-y-180',
    back: 'rotate-y-180',
  },
} as const

function useFlipCard(): Accessor<FlipCardContextValue> {
  const context = useContext(FlipCardContext)
  if (!context) {
    throw new Error('FlipCard.Front and FlipCard.Back must be used within <FlipCard>.')
  }
  return context
}

type FlipCardRootProps = JSX.HTMLAttributes<HTMLDivElement> & {
  rotate?: FlipCardRotate
  /** React parity alias; merges with `class`. */
  className?: string
}

function FlipCardRoot(props: FlipCardRootProps) {
  const [own, rest] = splitProps(props, ['rotate', 'class', 'className', 'children'])
  const rotate = () => own.rotate ?? 'y'
  const value = createMemo(() => ({ rotate: rotate() }))

  return (
    <FlipCardContext.Provider value={value}>
      <div
        class={`group/card h-72 w-56 perspective-[1000px] ${own.class ?? ''} ${own.className ?? ''}`}
        {...rest}
      >
        <div
          class={`relative h-full rounded-2xl transition-transform duration-500 ease-out transform-3d will-change-transform motion-reduce:transition-none ${ROTATION_CLASS[rotate()].hover}`}
        >
          {own.children}
        </div>
      </div>
    </FlipCardContext.Provider>
  )
}

type FlipCardFaceProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /** React parity alias; merges with `class`. */
  className?: string
}

function FlipCardFront(props: FlipCardFaceProps) {
  const [own, rest] = splitProps(props, ['class', 'className'])
  useFlipCard()

  return (
    <div
      class={`absolute inset-0 backface-hidden ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    />
  )
}

function FlipCardBack(props: FlipCardFaceProps) {
  const [own, rest] = splitProps(props, ['class', 'className'])
  const ctx = useFlipCard()

  return (
    <div
      class={`absolute inset-0 backface-hidden ${ROTATION_CLASS[ctx().rotate].back} ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    />
  )
}

const FlipCard = Object.assign(FlipCardRoot, {
  Front: FlipCardFront,
  Back: FlipCardBack,
}) as typeof FlipCardRoot & {
  Front: typeof FlipCardFront
  Back: typeof FlipCardBack
}

export default FlipCard
export { FlipCard, FlipCardBack, FlipCardFront, FlipCardRoot }
