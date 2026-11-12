// Built with Paper Shaders (github.com/paper-design/shaders) — Apache-2.0. NOTICE + exact-version pin per LICENSE-SOURCES.md.
// Source: github.com/paper-design/shaders packages/shaders-react/src/shaders/mesh-gradient.tsx@0.0.82 (Nov 2026). License: Apache-2.0.
// PORT-NOTE: vanilla-core port (`@paper-design/shaders` ShaderMount, no shaders-react). Upstream extends React div props; the Solid
// port accepts class/className/style/width/height plus the mount-tuning props only. Uniform updates go through a reactive effect.

import { createEffect, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'
import {
  ShaderMount,
  ShaderFitOptions,
  defaultObjectSizing,
  getShaderColorFromString,
  meshGradientFragmentShader,
} from '@paper-design/shaders'
import type { MeshGradientParams, ShaderMountUniforms } from '@paper-design/shaders'

export interface MeshGradientProps extends MeshGradientParams {
  /**
   * Solid class, merged alongside `className`.
   */
  class?: string
  className?: string
  style?: JSX.CSSProperties
  /** Inline CSS width style */
  width?: string | number
  /** Inline CSS height style */
  height?: string | number
  minPixelRatio?: number
  maxPixelCount?: number
  webGlContextAttributes?: WebGLContextAttributes
}

const defaultProps: Required<MeshGradientParams> = {
  ...defaultObjectSizing,
  speed: 1,
  frame: 0,
  colors: ['#e0eaff', '#241d9a', '#f75092', '#9f50d3'],
  distortion: 0.8,
  swirl: 0.1,
  grainMixer: 0,
  grainOverlay: 0,
}

function MeshGradient(props: MeshGradientProps) {
  let el!: HTMLDivElement
  let mount: ShaderMount | undefined

  // PORT-NOTE: typed as ShaderMountUniforms (the mount's accepted shape); fields are still structurally checked against MeshGradientUniforms
  const buildUniforms = (): ShaderMountUniforms => ({
    // Own uniforms
    u_colors: (props.colors ?? defaultProps.colors).map(getShaderColorFromString),
    u_colorsCount: (props.colors ?? defaultProps.colors).length,
    u_distortion: props.distortion ?? defaultProps.distortion,
    u_swirl: props.swirl ?? defaultProps.swirl,
    u_grainMixer: props.grainMixer ?? defaultProps.grainMixer,
    u_grainOverlay: props.grainOverlay ?? defaultProps.grainOverlay,

    // Sizing uniforms
    u_fit: ShaderFitOptions[props.fit ?? defaultProps.fit],
    u_rotation: props.rotation ?? defaultProps.rotation,
    u_scale: props.scale ?? defaultProps.scale,
    u_offsetX: props.offsetX ?? defaultProps.offsetX,
    u_offsetY: props.offsetY ?? defaultProps.offsetY,
    u_originX: props.originX ?? defaultProps.originX,
    u_originY: props.originY ?? defaultProps.originY,
    u_worldWidth: props.worldWidth ?? defaultProps.worldWidth,
    u_worldHeight: props.worldHeight ?? defaultProps.worldHeight,
  })

  const lengthToCss = (v: string | number | undefined) =>
    v === undefined ? undefined : typeof v === 'number' ? `${v}px` : v

  onMount(() => {
    mount = new ShaderMount(
      el,
      meshGradientFragmentShader,
      buildUniforms(),
      props.webGlContextAttributes,
      props.speed ?? defaultProps.speed,
      props.frame ?? defaultProps.frame,
      props.minPixelRatio,
      props.maxPixelCount,
    )
    onCleanup(() => mount?.dispose())
  })

  // Uniform updates (ShaderMount diffs uniform values internally, so a full set is cheap)
  createEffect(() => {
    mount?.setUniforms(buildUniforms())
  })

  // Motion params are mount-level, not uniforms
  createEffect(() => {
    mount?.setSpeed(props.speed ?? defaultProps.speed)
  })
  createEffect(() => {
    mount?.setFrame(props.frame ?? defaultProps.frame)
  })

  return (
    <div
      ref={el}
      class={`paper-shaders-mesh-gradient ${props.class ?? ''} ${props.className ?? ''}`}
      style={{
        width: lengthToCss(props.width),
        height: lengthToCss(props.height),
        ...props.style,
      }}
    />
  )
}

export default MeshGradient
