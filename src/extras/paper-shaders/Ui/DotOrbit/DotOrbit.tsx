// Built with Paper Shaders (github.com/paper-design/shaders) — Apache-2.0. NOTICE + exact-version pin per LICENSE-SOURCES.md.
// Source: github.com/paper-design/shaders packages/shaders-react/src/shaders/dot-orbit.tsx@0.0.82 (Nov 2026). License: Apache-2.0.
// PORT-NOTE: vanilla-core port (`@paper-design/shaders` ShaderMount, no shaders-react). Upstream extends React div props; the Solid
// port accepts class/className/style/width/height plus the mount-tuning props only. Uniform updates go through a reactive effect.

import { createEffect, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'
import {
  ShaderMount,
  ShaderFitOptions,
  defaultPatternSizing,
  getShaderColorFromString,
  getShaderNoiseTexture,
  dotOrbitFragmentShader,
} from '@paper-design/shaders'
import type { DotOrbitParams, ShaderMountUniforms } from '@paper-design/shaders'

export interface DotOrbitProps extends DotOrbitParams {
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

const defaultProps: Required<DotOrbitParams> = {
  ...defaultPatternSizing,
  speed: 1.5,
  frame: 0,
  colorBack: '#000000',
  colors: ['#ffc96b', '#ff6200', '#ff2f00', '#421100', '#1a0000'],
  size: 1,
  sizeRange: 0,
  spreading: 1,
  stepsPerColor: 4,
}

function DotOrbit(props: DotOrbitProps) {
  let el!: HTMLDivElement
  let mount: ShaderMount | undefined

  // PORT-NOTE: typed as ShaderMountUniforms (the mount's accepted shape); fields are still structurally checked against DotOrbitUniforms
  const buildUniforms = (): ShaderMountUniforms => ({
    // Own uniforms
    u_colorBack: getShaderColorFromString(props.colorBack ?? defaultProps.colorBack),
    u_colors: (props.colors ?? defaultProps.colors).map(getShaderColorFromString),
    u_colorsCount: (props.colors ?? defaultProps.colors).length,
    u_size: props.size ?? defaultProps.size,
    u_sizeRange: props.sizeRange ?? defaultProps.sizeRange,
    u_spreading: props.spreading ?? defaultProps.spreading,
    u_stepsPerColor: props.stepsPerColor ?? defaultProps.stepsPerColor,
    u_noiseTexture: getShaderNoiseTexture(),

    // Sizing uniforms
    u_fit: ShaderFitOptions[props.fit ?? defaultProps.fit],
    u_scale: props.scale ?? defaultProps.scale,
    u_rotation: props.rotation ?? defaultProps.rotation,
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
      dotOrbitFragmentShader,
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
      class={`paper-shaders-dot-orbit ${props.class ?? ''} ${props.className ?? ''}`}
      style={{
        width: lengthToCss(props.width),
        height: lengthToCss(props.height),
        ...props.style,
      }}
    />
  )
}

export default DotOrbit
