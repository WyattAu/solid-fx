// Built with gradient-gl (github.com/metaory/gradient-gl) — MIT.
//
// Duotone-flow WebGL gradient background (shader `c1`): deterministic,
// seed-driven procedural gradient animation on a caller-sized canvas.
// Upstream is a vanilla WebGL factory — canvas + rAF, no framework layer —
// so the port is init in onMount, `program.destroy()` in onCleanup.
//
// PORT-NOTE: gradient-gl keeps a single live program per document; mounting
// a second gradient-gl background with a different shader destroys the
// first (upstream singleton — see the package README "Cleanup").

import gradientGL, { type GradientGlProgram } from 'gradient-gl'
import type { JSX } from 'solid-js'
import { onCleanup, onMount } from 'solid-js'

export interface FlowGradientProps {
  /**
   * gradient-gl seed `{shader}.{speed}{hue}{sat}{light}`. The shader prefix
   * is `c1` (contrast duotone flow) — keep it to preserve the effect.
   * @default 'c1.eba9'
   */
  seed?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

// Per-instance canvas id: upstream mounts by CSS selector, and it also
// sweeps document-level `#gradient-gl` canvases when creating its own —
// instance ids must be unique and not that reserved id.
let instanceCount = 0

export default function FlowGradient(props: FlowGradientProps) {
  const canvasId = `gradient-gl-flow-${++instanceCount}`
  const mergedClass = () =>
    ['relative h-full w-full overflow-hidden', props.class, props.className]
      .filter(Boolean)
      .join(' ')

  let canvasEl!: HTMLCanvasElement

  onMount(() => {
    let disposed = false
    let program: GradientGlProgram | undefined
    // The shader loads async; if unmount wins the race, destroy on settle
    // (upstream README's documented cleanup contract).
    gradientGL(props.seed ?? 'c1.eba9', `#${canvasId}`)
      .then(p => {
        if (disposed) {
          p.destroy()
          return
        }
        program = p
      })
      .catch(() => {
        // Unknown seed → upstream throws; degrade to the plain canvas
        // instead of an unhandled rejection.
      })
    onCleanup(() => {
      disposed = true
      program?.destroy()
      program = undefined
      // Caller-owned canvases keep their context after upstream destroy() —
      // release it explicitly (PORTING.md §4 WebGL disposal).
      canvasEl.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
    })
  })

  return (
    <div class={mergedClass()} style={props.style} aria-hidden="true">
      <canvas ref={canvasEl} id={canvasId} class="absolute inset-0 block h-full w-full" />
    </div>
  )
}
