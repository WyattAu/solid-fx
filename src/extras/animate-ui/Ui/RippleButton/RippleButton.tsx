// solid-fx Buttons widget — port of the Animate UI Ripple Button primitive
// (MIT + Commons Clause — see LICENSE-SOURCES.md). A ripple expands from
// the click point and fades (Solid + CSS rewrite of the React original).
import type { JSX } from 'solid-js'
import { createSignal, For, splitProps } from 'solid-js'

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

export interface RippleButtonProps {
  children: JSX.Element
  /** Ripple color (default white 45% alpha). */
  rippleColor?: string
  /** Ripple lifetime in ms (default 600). */
  duration?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
  onClick?: (event: MouseEvent) => void
}

const KEYFRAME = `
@keyframes anui-ripple {
  from { transform: scale(0); opacity: 0.6; }
  to { transform: scale(1); opacity: 0; }
}
`

export function RippleButton(props: RippleButtonProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'rippleColor',
    'duration',
    'class',
    'className',
    'style',
    'onClick',
  ])

  const [ripples, setRipples] = createSignal<Ripple[]>([])
  let nextId = 0
  let button!: HTMLButtonElement

  const spawn = (event: MouseEvent) => {
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2.2
    const id = nextId++
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2
    setRipples(r => [...r, { id, x, y, size }])
    setTimeout(() => setRipples(r => r.filter(rip => rip.id !== id)), own.duration ?? 600)
  }

  return (
    <>
      <style>{KEYFRAME}</style>
      <button
        type="button"
        ref={el => {
          button = el
        }}
        {...rest}
        class={`relative overflow-hidden rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-100 outline-none transition-colors hover:border-gray-500 hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-sky-400 ${own.class ?? ''} ${own.className ?? ''}`}
        style={own.style}
        onClick={e => {
          spawn(e)
          props.onClick?.(e)
        }}
      >
        {props.children}
        <For each={ripples()}>
          {r => (
            <span
              class="pointer-events-none absolute rounded-full"
              style={{
                left: `${r.x}px`,
                top: `${r.y}px`,
                width: `${r.size}px`,
                height: `${r.size}px`,
                background: own.rippleColor ?? 'rgba(255, 255, 255, 0.45)',
                animation: `anui-ripple ${own.duration ?? 600}ms ease-out forwards`,
              }}
            />
          )}
        </For>
      </button>
    </>
  )
}

export default RippleButton
