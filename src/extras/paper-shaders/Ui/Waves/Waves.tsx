// Built with Paper Shaders (github.com/paper-design/shaders) — Apache-2.0. NOTICE + exact-version pin per LICENSE-SOURCES.md.
// Source: github.com/paper-design/shaders packages/shaders-react/src/shaders/waves.tsx@0.0.82 (Nov 2026). License: Apache-2.0.
// PORT-NOTE: vanilla-core port (`@paper-design/shaders` ShaderMount, no shaders-react). Upstream extends React div props; the Solid
// port accepts class/className/style/width/height plus the mount-tuning props only. Uniform updates go through a reactive effect.
// Upstream Waves is a static pattern: no speed/frame params (matches React Waves, which never sets motion params).

import { createEffect, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'
import {
  ShaderMount,
  ShaderFitOptions,
  defaultPatternSizing,
  getShaderColorFromString,
  wavesFragmentShader,
} from '@paper-design/shaders'
import type { WavesParams, ShaderMountUniforms } from '@paper-design/shaders'

export interface WavesProps extends WavesParams {
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

const defaultProps: Required<WavesParams> = {
  ...defaultPatternSizing,
  scale: 0.6,
  colorFront: '#ffbb00',
  colorBack: '#000000',
  shape: 0,
  frequency: 0.5,
  amplitude: 0.5,
  spacing: 1.2,
  proportion: 0.1,
  softness: 0,
}

function Waves(props: WavesProps) {
  let el!: HTMLDivElement
  let mount: ShaderMount | undefined

  // PORT-NOTE: typed as ShaderMountUniforms (the mount's accepted shape); fields are still structurally checked against WavesUniforms
  const buildUniforms = (): ShaderMountUniforms => ({
    // Own uniforms
    u_colorFront: getShaderColorFromString(props.colorFront ?? defaultProps.colorFront),
    u_colorBack: getShaderColorFromString(props.colorBack ?? defaultProps.colorBack),
    u_shape: props.shape ?? defaultProps.shape,
    u_frequency: props.frequency ?? defaultProps.frequency,
    u_amplitude: props.amplitude ?? defaultProps.amplitude,
    u_spacing: props.spacing ?? defaultProps.spacing,
    u_proportion: props.proportion ?? defaultProps.proportion,
    u_softness: props.softness ?? defaultProps.softness,

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
    // Upstream raises maxPixelCount for Waves to keep the fine pattern crisp at high resolutions
    mount = new ShaderMount(
      el,
      wavesFragmentShader,
      buildUniforms(),
      props.webGlContextAttributes,
      0,
      0,
      props.minPixelRatio,
      props.maxPixelCount ?? 6016 * 3384,
    )
    onCleanup(() => mount?.dispose())
  })

  // Uniform updates (ShaderMount diffs uniform values internally, so a full set is cheap)
  createEffect(() => {
    mount?.setUniforms(buildUniforms())
  })

  return (
    <div
      ref={el}
      class={`paper-shaders-waves ${props.class ?? ''} ${props.className ?? ''}`}
      style={{
        width: lengthToCss(props.width),
        height: lengthToCss(props.height),
        ...props.style,
      }}
    />
  )
}

export default Waves
