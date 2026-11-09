// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/confetti.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// The directory is named ConfettiButton (the file's second export) to avoid
// colliding with src/extras/tsparticles/Ui/Confetti; both upstream exports
// (`Confetti` canvas wrapper and `ConfettiButton`) are ported here.

import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from 'canvas-confetti'
import confetti from 'canvas-confetti'
import type { JSX } from 'solid-js'
import { createEffect, onCleanup, onMount, splitProps, untrack } from 'solid-js'

export type ConfettiRef = {
  fire: (options?: ConfettiOptions) => Promise<void> | void
}

export interface ConfettiProps
  extends Omit<JSX.CanvasHTMLAttributes<HTMLCanvasElement>, 'ref' | 'children'> {
  options?: ConfettiOptions
  globalOptions?: ConfettiGlobalOptions
  /**
   * When true, the confetti does not fire on mount — call `fire` through the
   * imperative ref instead.
   */
  manualstart?: boolean
  children?: JSX.Element
  /**
   * React parity alias; merges with `class`.
   */
  className?: string
  /**
   * PORT-NOTE: upstream forwards a `ConfettiRef` imperative handle through
   * `forwardRef` + `useImperativeHandle`. The Solid port receives a callback
   * here: `ref={(api) => (confettiRef = api)}`.
   */
  ref?: (api: ConfettiRef) => void
}

// PORT-NOTE: upstream wraps the canvas and children in a ConfettiContext
// provider carrying the `fire` handle; the context is never consumed or
// exported inside this file, so the port drops it.
export const Confetti = (props: ConfettiProps) => {
  const [own, rest] = splitProps(props, [
    'options',
    'globalOptions',
    'manualstart',
    'children',
    'class',
    'className',
    'ref',
  ])

  let canvasEl!: HTMLCanvasElement
  let instance: ConfettiInstance | null = null

  const fire = async (opts: ConfettiOptions = {}) => {
    try {
      // Upstream reads optionsRef/globalOptionsRef at call time; untrack keeps
      // the auto-fire effect from re-firing when `options` changes.
      await instance?.({ ...(untrack(() => own.options) ?? {}), ...opts })
    } catch (error) {
      console.error('Confetti error:', error)
    }
  }

  // Upstream: create the confetti instance once on mount, reset on unmount.
  onMount(() => {
    instance = confetti.create(canvasEl, {
      resize: true,
      useWorker: true,
      ...(untrack(() => own.globalOptions) ?? {}),
    })
    own.ref?.({ fire })
    onCleanup(() => {
      instance?.reset()
      instance = null
    })
  })

  // Upstream: useEffect on [manualstart, fire] — fire on mount unless manual.
  createEffect(() => {
    if (!own.manualstart) {
      void fire()
    }
  })

  return (
    <>
      <canvas {...rest} ref={canvasEl} class={`${own.class ?? ''} ${own.className ?? ''}`} />
      {own.children}
    </>
  )
}

export interface ConfettiButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref' | 'children' | 'onClick'> {
  options?: ConfettiOptions & ConfettiGlobalOptions & { canvas?: HTMLCanvasElement }
  children?: JSX.Element
  /**
   * React parity alias; merges with `class`.
   */
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  onClick?: (event: MouseEvent) => void
  ref?: (el: HTMLButtonElement) => void
}

export const ConfettiButton = (props: ConfettiButtonProps) => {
  const [own, rest] = splitProps(props, [
    'options',
    'children',
    'class',
    'className',
    'ref',
    'onClick',
  ])

  const handleClick = async (event: MouseEvent) => {
    try {
      own.onClick?.(event)
      if (event.defaultPrevented) return

      const target = event.currentTarget
      if (target && target instanceof HTMLElement && 'getBoundingClientRect' in target) {
        const rect = target.getBoundingClientRect()
        const origin = {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }

        await confetti({
          zIndex: 9999,
          ...own.options,
          origin,
        })
      }
    } catch (error) {
      console.error('Confetti button error:', error)
    }
  }

  // PORT-NOTE: upstream renders shadcn's <Button> (default variant). The
  // primitive is inlined here with its default-variant utility classes so the
  // port stays free of shadcn imports.
  return (
    <button
      {...rest}
      type="button"
      ref={el => own.ref?.(el)}
      onClick={handleClick}
      class={`inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children}
    </button>
  )
}

export default ConfettiButton
