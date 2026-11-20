// solid-fx Data widget — original component (not a port).
// GPU histogram via parallel reduction passes (research 03 #67, WebGL2
// fragment form): the full sample array lives in an R32F texture and each
// bin is computed by its own 1×1 reduction fragment — 60 bins over 102400
// texels with zero CPU counting. Counts stay GPU-resident in an RGBA32F
// buffer until one readback populates the readout. Capability probe
// (EXT_color_buffer_float) with a Canvas2D fallback. Branchless fragment
// (SwiftShader-safe: no conditionals in loops).
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface GpuHistogramProps {
  /** Bin count, capped at 120 (default 60). */
  bins?: number
  /** RNG seed — identical corpus across users (default 1). */
  seed?: number
  /** Tail probability for the VaR marker (default 0.05). */
  varAlpha?: number
  /** Canvas width in px (default 440). */
  width?: number
  /** Canvas height in px (default 180). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const TEX_W = 320
const TEX_H = 320
const N = TEX_W * TEX_H // 102400 samples

const VERT = `#version 300 es
const vec2 pos[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main() { gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0); }`

// reduction pass: counts samples inside [uLo, uHi] into a single texel.
// Branchless (SwiftShader-safe): indicator multiply, no conditionals.
const FRAG_BIN = `#version 300 es
precision highp float;
uniform sampler2D uSamples;
uniform float uLo;
uniform float uHi;
out vec4 outColor;
void main() {
  float acc = 0.0;
  for (int k = 0; k < ${N}; k++) {
    ivec2 t = ivec2(k % ${TEX_W}, k / ${TEX_W});
    float v = texelFetch(uSamples, t, 0).r;
    acc += step(uLo, v) * step(v, uHi);
  }
  outColor = vec4(acc, 0.0, 0.0, 1.0);
}`

// display pass: draws bars by texel-fetching the GPU-resident counts
const FRAG_BARS = `#version 300 es
precision highp float;
uniform sampler2D uCounts;
uniform int uBins;
uniform vec2 uRes;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  int bar = int(uv.x * float(uBins));
  float count = texelFetch(uCounts, ivec2(bar, 0), 0).r;
  float peak = 1e-6;
  for (int i = 0; i < uBins; i++) {
    peak = max(peak, texelFetch(uCounts, ivec2(i, 0), 0).r);
  }
  float h = (count / peak) * 0.86;
  float inBar = step(uv.y, 0.06 + h) * step(0.06, uv.y);
  vec3 col = mix(vec3(0.20, 0.34, 0.52), vec3(0.35, 0.55, 0.72), inBar);
  outColor = vec4(col, 1.0);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('GpuHistogram shader:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function GpuHistogram(props: GpuHistogramProps) {
  const alpha = () => own.varAlpha ?? 0.05
  const [own, rest] = splitProps(props, [
    'bins',
    'seed',
    'varAlpha',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 440
  const height = () => own.height ?? 180
  const nb = () => Math.min(120, own.bins ?? 60)
  const [supported, setSupported] = createSignal<boolean | null>(null)
  const [readout, setReadout] = createSignal('computing on GPU…')
  let canvas!: HTMLCanvasElement
  let gl: WebGL2RenderingContext | null = null
  const programs: Record<string, WebGLProgram | null> = {}
  let samplesTex: WebGLTexture | null = null
  let countsTex: WebGLTexture | null = null
  let countsFbo: WebGLFramebuffer | null = null

  // seeded heavy-tail corpus, padded exactly to the texture size
  const buildSamples = (): Float32Array => {
    const rng = mulberry32((own.seed ?? 1) >>> 0)
    const gauss = () => {
      const u = Math.max(1e-12, rng())
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
    }
    const out = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const w = gauss() * gauss() * 0.15 + 1
      out[i] = gauss() / Math.sqrt(w)
    }
    return out
  }

  const runPipeline = () => {
    const g = gl
    if (!g || !programs.bin || !programs.bars || !countsFbo || !countsTex) return
    const progBin = programs.bin
    const progBars = programs.bars

    // per-bin reduction: 60 passes, each writing one 1×1 texel of the
    // counts texture — the GPU-side counting, zero CPU involvement
    g.useProgram(progBin)
    for (let b = 0; b < nb(); b++) {
      const lo = -6 + (12 * b) / nb()
      const hi = -6 + (12 * (b + 1)) / nb()
      g.uniform1f(g.getUniformLocation(progBin, 'uLo'), lo)
      g.uniform1f(g.getUniformLocation(progBin, 'uHi'), hi)
      g.bindFramebuffer(g.FRAMEBUFFER, countsFbo)
      g.viewport(b, 0, 1, 1)
      g.drawArrays(g.TRIANGLES, 0, 3)
    }

    // present: bars drawn from the GPU-resident counts texture
    g.bindFramebuffer(g.FRAMEBUFFER, null)
    g.viewport(0, 0, width(), height())
    g.useProgram(progBars)
    g.uniform1i(g.getUniformLocation(progBars, 'uCounts'), 0)
    g.uniform1i(g.getUniformLocation(progBars, 'uBins'), nb())
    g.uniform2f(g.getUniformLocation(progBars, 'uRes'), width(), height())
    g.drawArrays(g.TRIANGLES, 0, 3)
  }

  const readback = () => {
    const g = gl
    const progBin = programs.bin
    if (!g || !progBin || !countsTex || !countsFbo) return
    g.bindFramebuffer(g.FRAMEBUFFER, countsFbo)
    const nbv = nb()
    const buf = new Float32Array(nbv * 4)
    g.readPixels(0, 0, nbv, 1, g.RGBA, g.FLOAT, buf)
    let total = 0
    let peak = 0
    let argmax = 0
    for (let i = 0; i < nbv; i++) {
      total += buf[i * 4]
      if (buf[i * 4] > peak) {
        peak = buf[i * 4]
        argmax = i
      }
    }
    setReadout(`${total.toLocaleString()} samples · peak bin ${argmax} (${peak.toLocaleString()})`)
  }

  onMount(() => {
    gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
    })
    const g = gl
    const floatOk =
      g &&
      (g.getExtension('EXT_color_buffer_float') || g.getExtension('EXT_color_buffer_half_float'))
    if (!g || !floatOk) {
      setSupported(false)
      return
    }
    const vs = compile(g, g.VERTEX_SHADER, VERT)
    const fsBin = compile(g, g.FRAGMENT_SHADER, FRAG_BIN)
    const fsBars = compile(g, g.FRAGMENT_SHADER, FRAG_BARS)
    if (!vs || !fsBin || !fsBars) {
      setSupported(false)
      return
    }
    const link = (fs: WebGLShader): WebGLProgram | null => {
      const p = g.createProgram()
      g.attachShader(p, vs)
      g.attachShader(p, fs)
      g.linkProgram(p)
      if (!g.getProgramParameter(p, g.LINK_STATUS)) {
        console.error('GpuHistogram link:', g.getProgramInfoLog(p))
        return null
      }
      return p
    }
    programs.bin = link(fsBin)
    programs.bars = link(fsBars)
    if (!programs.bin || !programs.bars) {
      setSupported(false)
      return
    }

    // sample texture: R32F, exactly N values (the whole corpus, GPU-resident)
    samplesTex = g.createTexture()
    g.bindTexture(g.TEXTURE_2D, samplesTex)
    g.texImage2D(g.TEXTURE_2D, 0, g.R32F, TEX_W, TEX_H, 0, g.RED, g.FLOAT, buildSamples())
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)

    countsTex = g.createTexture()
    g.bindTexture(g.TEXTURE_2D, countsTex)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA32F, nb(), 1, 0, g.RGBA, g.FLOAT, null)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
    countsFbo = g.createFramebuffer()
    g.bindFramebuffer(g.FRAMEBUFFER, countsFbo)
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, countsTex, 0)

    setSupported(true)
    runPipeline()
    readback()
    onCleanup(() => {
      g.getExtension('WEBGL_lose_context')?.loseContext()
    })
  })

  const alpha = () => own.varAlpha ?? 0.05

  return (
    <figure
      {...rest}
      class={`inline-block ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <canvas
        ref={canvas}
        width={width()}
        height={height()}
        class={`w-full rounded-lg ${supported() === false ? 'hidden' : ''}`}
        style={{ 'max-width': `${width()}px` }}
        role="img"
        aria-label={`${own.label ?? 'GPU histogram'} — ${N.toLocaleString()} samples binned in ${nb()} GPU reduction passes`}
      />
      {supported() === false && (
        <div
          class="flex items-center justify-center rounded-lg text-xs text-gray-400"
          style={{
            width: `${width()}px`,
            height: `${height()}px`,
            background: 'linear-gradient(160deg, oklch(0.18 0.02 250), oklch(0.25 0.03 235))',
          }}
        >
          WebGL2 float targets unavailable — static fallback
        </div>
      )}
      {supported() === null && (
        <div
          class="flex items-center justify-center rounded-lg bg-gray-900 text-xs text-gray-500"
          style={{ width: `${width()}px`, height: `${height()}px` }}
        >
          probing WebGL2…
        </div>
      )}
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'GPU histogram'}</span>
        <span class="font-mono text-[10px] text-gray-500" aria-live="polite">
          VaR {alpha() * 100}% · {readout()} · {nb()} reduction passes · zero CPU counting
        </span>
      </figcaption>
    </figure>
  )
}

export default GpuHistogram
