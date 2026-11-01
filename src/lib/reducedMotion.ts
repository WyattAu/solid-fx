import { createSignal, onCleanup } from 'solid-js'

/**
 * Solid replacement for motion/react's useReducedMotion().
 * Returns an accessor; call it to read the current value reactively.
 * Must be called during component setup (registers onCleanup).
 */
export function useReducedMotion(): () => boolean {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  const [reduced, setReduced] = createSignal(mql.matches)
  const onChange = () => setReduced(mql.matches)
  mql.addEventListener('change', onChange)
  onCleanup(() => mql.removeEventListener('change', onChange))
  return reduced
}
