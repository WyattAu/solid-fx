import { onCleanup } from 'solid-js'

export interface AutoPointerOptions {
  /** Dispatches per second (default 20). */
  hz?: number
  /** Fraction of the element the pointer roams (default 0.55 — always inside). */
  roam?: number
  /** Dispatch `mousemove` instead of `pointermove` (for mouse-only listeners). */
  mouse?: boolean
  /** Emit a pointerdown/up + click at the current point every N ms (0 = never). */
  clickEvery?: number
}

/**
 * Keeps an interaction-driven demo alive with zero user input (PORTING.md §6):
 * an rAF-driven loop dispatches synthetic pointer events on `el` along a
 * Lissajous path inside the element's rect. Bubbling reaches `window`
 * listeners too. Must be called during component setup (registers onCleanup).
 */
export function autoPointer(el: HTMLElement, options: AutoPointerOptions = {}): void {
  const hz = options.hz ?? 20
  const roam = options.roam ?? 0.55
  const interval = 1000 / hz
  const phase = Math.random() * Math.PI * 2
  let raf = 0
  let last = -interval
  let lastClick = performance.now()
  let x = 0
  let y = 0

  const point = (now: number) => {
    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return false
    const t = now / 1000
    const ax = (rect.width * roam) / 2
    const ay = (rect.height * roam) / 2
    x = rect.left + rect.width / 2 + Math.cos(t * 0.9 + phase) * ax
    y = rect.top + rect.height / 2 + Math.sin(t * 1.7 + phase) * ay
    x = Math.min(Math.max(x, rect.left + 1), rect.right - 1)
    y = Math.min(Math.max(y, rect.top + 1), rect.bottom - 1)
    return true
  }

  const dispatch = (type: string, pressed: boolean) => {
    // Real input lands on the topmost element at the point, so dispatch there
    // and let the event bubble through the component's own handler nodes
    // (e.g. a mover div with onClick). Fall back to `el` when hit-testing
    // misses or the topmost element is outside `el` (overlapping chrome).
    const hit = document.elementFromPoint(x, y)
    const target = hit && el.contains(hit) && hit instanceof HTMLElement ? hit : el
    if (options.mouse) {
      target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }))
    } else {
      target.dispatchEvent(
        new PointerEvent(type, {
          clientX: x,
          clientY: y,
          bubbles: true,
          pointerType: 'mouse',
          isPrimary: true,
          buttons: pressed ? 1 : 0,
        }),
      )
    }
  }

  const tick = (now: number) => {
    if (now - last >= interval && point(now)) {
      last = now
      dispatch(options.mouse ? 'mousemove' : 'pointermove', false)
      if (options.clickEvery && now - lastClick >= options.clickEvery) {
        lastClick = now
        dispatch('pointerdown', true)
        dispatch('pointerup', false)
        dispatch('click', false)
      }
    }
    raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)
  onCleanup(() => cancelAnimationFrame(raf))
}
