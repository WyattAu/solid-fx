// Source: github.com/ibelick/motion-primitives components/core/dock.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream injects `width`/`isHovered` MotionValues into
// DockLabel/DockIcon via React.Children.map + cloneElement; the Solid port
// publishes them through a dock-item context (identical public composition
// API). The useSpring/useTransform chains are ported to vanilla motionValues
// re-anchored by animate() calls on every mousemove / hover change
// (PORTING.md §5, Magnetic precedent); magnification interpolation uses
// motion's `transform()` with the same input/output ranges. AnimatePresence
// (DockLabel) is sequenced manually: the exit animation runs, then the
// element unmounts on completion.

import { animate, motionValue, transform } from 'motion'
import type { AnimationPlaybackControlsWithThen, MotionValue, SpringOptions } from 'motion'
import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Show,
  splitProps,
  useContext,
} from 'solid-js'
import type { JSX } from 'solid-js'

const DOCK_HEIGHT = 128
const DEFAULT_MAGNIFICATION = 80
const DEFAULT_DISTANCE = 150
const DEFAULT_PANEL_HEIGHT = 64

export type DockProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  distance?: number
  panelHeight?: number
  magnification?: number
  spring?: SpringOptions
}

export type DockItemProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  children: JSX.Element
  onClick?: () => void
}

export type DockLabelProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  children: JSX.Element
}

export type DockIconProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  children: JSX.Element
}

type DockContextValue = {
  mouseX: MotionValue
  spring: () => SpringOptions
  distance: () => number
  magnification: () => number
}

type DockItemContextValue = {
  width: MotionValue<number>
  isHovered: MotionValue<number>
}

const DockContext = createContext<DockContextValue>()
const DockItemContext = createContext<DockItemContextValue>()

function useDock() {
  const context = useContext(DockContext)
  if (!context) {
    throw new Error('useDock must be used within a Dock component')
  }
  return context
}

function useDockItem() {
  const context = useContext(DockItemContext)
  if (!context) {
    throw new Error('useDockItem must be used within a DockItem')
  }
  return context
}

export function Dock(props: DockProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'distance',
    'panelHeight',
    'magnification',
    'spring',
  ])

  const mouseX = motionValue(Infinity)
  const isHovered = motionValue(0)

  const distance = () => own.distance ?? DEFAULT_DISTANCE
  const magnification = () => own.magnification ?? DEFAULT_MAGNIFICATION
  const panelHeight = () => own.panelHeight ?? DEFAULT_PANEL_HEIGHT
  const spring = () => own.spring ?? { mass: 0.1, stiffness: 150, damping: 12 }

  // Upstream: useMemo over magnification.
  const maxHeight = () => Math.max(DOCK_HEIGHT, magnification() + magnification() / 2 + 4)

  let outerEl!: HTMLDivElement
  const heightMv = motionValue(panelHeight())
  let heightAnim: AnimationPlaybackControlsWithThen | undefined

  onMount(() => {
    const apply = () => {
      outerEl.style.height = `${heightMv.get()}px`
    }
    apply()
    // Upstream: height = useSpring(useTransform(isHovered, [0, 1],
    // [panelHeight, maxHeight]), spring) — a spring retarget per hover state.
    const offHover = isHovered.on('change', v => {
      heightAnim?.stop()
      heightAnim = animate(heightMv, v === 1 ? maxHeight() : panelHeight(), spring())
    })
    const offApply = heightMv.on('change', apply)
    onCleanup(() => {
      offHover()
      offApply()
      heightAnim?.stop()
    })
  })

  return (
    <div
      {...rest}
      ref={outerEl}
      class="mx-2 flex max-w-full items-end overflow-x-auto"
      style={{ 'scrollbar-width': 'none' }}
    >
      <div
        onMouseMove={(e: MouseEvent) => {
          isHovered.set(1)
          mouseX.set(e.pageX)
        }}
        onMouseLeave={() => {
          isHovered.set(0)
          mouseX.set(Infinity)
        }}
        class={`mx-auto flex w-fit gap-4 rounded-2xl bg-gray-50 px-4 dark:bg-neutral-900 ${own.class ?? ''} ${own.className ?? ''}`}
        style={{ height: `${panelHeight()}px` }}
        role="toolbar"
        aria-label="Application dock"
      >
        <DockContext.Provider value={{ mouseX, spring, distance, magnification }}>
          {own.children}
        </DockContext.Provider>
      </div>
    </div>
  )
}

export function DockItem(props: DockItemProps) {
  const [own, rest] = splitProps(props, ['children', 'class', 'className', 'onClick'])
  const ctx = useDock()

  let el!: HTMLDivElement
  const isHovered = motionValue(0)
  const width = motionValue(40)
  let widthAnim: AnimationPlaybackControlsWithThen | undefined

  onMount(() => {
    // Upstream: mouseDistance = mouseX - rect.x - width/2, interpolated over
    // [-distance, 0, distance] → [40, magnification, 40] (clamped).
    const computeWidth = () => {
      const domRect = el.getBoundingClientRect()
      const mouseDistance = ctx.mouseX.get() - domRect.x - domRect.width / 2
      return transform(
        mouseDistance,
        [-ctx.distance(), 0, ctx.distance()],
        [40, ctx.magnification(), 40],
      )
    }
    const retarget = () => {
      widthAnim?.stop()
      widthAnim = animate(width, computeWidth(), ctx.spring())
    }
    const offMouse = ctx.mouseX.on('change', retarget)
    retarget()

    const handleEnter = () => isHovered.set(1)
    const handleLeave = () => isHovered.set(0)
    const handleFocus = () => isHovered.set(1)
    const handleBlur = () => isHovered.set(0)
    el.addEventListener('mouseenter', handleEnter)
    el.addEventListener('mouseleave', handleLeave)
    el.addEventListener('focus', handleFocus)
    el.addEventListener('blur', handleBlur)

    onCleanup(() => {
      offMouse()
      widthAnim?.stop()
      el.removeEventListener('mouseenter', handleEnter)
      el.removeEventListener('mouseleave', handleLeave)
      el.removeEventListener('focus', handleFocus)
      el.removeEventListener('blur', handleBlur)
    })
  })

  return (
    <div
      {...rest}
      ref={el}
      class={`relative inline-flex items-center justify-center ${own.class ?? ''} ${own.className ?? ''}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      onClick={() => own.onClick?.()}
    >
      <DockItemContext.Provider value={{ width, isHovered }}>
        {own.children}
      </DockItemContext.Provider>
    </div>
  )
}

export function DockLabel(props: DockLabelProps) {
  const [own] = splitProps(props, ['children', 'class', 'className'])
  const item = useDockItem()

  const [isVisible, setIsVisible] = createSignal(item.isHovered.get() === 1)
  const [present, setPresent] = createSignal(isVisible())
  let el: HTMLDivElement | undefined
  let controls: AnimationPlaybackControlsWithThen | undefined

  onMount(() => {
    const off = item.isHovered.on('change', latest => setIsVisible(latest === 1))
    onCleanup(off)
  })

  createEffect(() => {
    const visible = isVisible()
    if (visible) {
      if (!present()) setPresent(true)
    } else if (present()) {
      controls?.stop()
      if (el) {
        controls = animate(el, { opacity: 0, y: 0 }, { duration: 0.2 })
        void controls.then(() => {
          if (!isVisible()) setPresent(false)
        })
      } else {
        setPresent(false)
      }
    }
  })

  const labelRef = (node: HTMLDivElement) => {
    el = node
    onCleanup(() => {
      controls?.stop()
      el = undefined
    })
    // Upstream: initial={ opacity: 0, y: 0 } applied before entering.
    node.style.opacity = '0'
    node.style.transform = 'translate(-50%, 0px)'
    controls?.stop()
    controls = animate(node, { opacity: 1, y: -10 }, { duration: 0.2 })
  }

  return (
    <Show when={present()}>
      <div
        ref={labelRef}
        role="tooltip"
        class={`absolute -top-6 left-1/2 w-fit rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs whitespace-pre text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white ${own.class ?? ''} ${own.className ?? ''}`}
      >
        {own.children}
      </div>
    </Show>
  )
}

export function DockIcon(props: DockIconProps) {
  const [own] = splitProps(props, ['children', 'class', 'className'])
  const item = useDockItem()

  let el!: HTMLDivElement
  onMount(() => {
    // Upstream: width = useTransform(width, (val) => val / 2).
    const apply = () => {
      el.style.width = `${item.width.get() / 2}px`
    }
    apply()
    const off = item.width.on('change', apply)
    onCleanup(off)
  })

  return (
    <div
      ref={el}
      class={`flex items-center justify-center ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children}
    </div>
  )
}

export default Dock
