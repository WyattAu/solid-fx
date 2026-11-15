// solid-fx FX widget — original component (not a port). WebGL2 Bayer
// ordered-dither field: a razor-sharp blue-noise-adjacent print/E-ink texture
// from one animated gradient + an 8×8 Bayer matrix — no textures, no blur,
// universal WebGL2 (SwiftShader-safe). Quantization is the aesthetic.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'

export interface DitherFieldProps {
  /** Gradient start color as hex (default #0e7490 — cyan-700). */
  from?: string
  /** Gradient end color as hex (default #d97706 — amber-600). */
  to?: string
  /** Gradient drift speed (default 1; 0 freezes — reduced motion). */
  speed?: number
  /** Scale of the underlying gradient (default 1). */
  scale?: number
  /** Canvas width in px (default 320). */
  width?: number
  /** Canvas height in px (default 200). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const VERT = `#version 300 es
const vec2 pos[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main() { gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScale;
uniform vec3 uFrom;
uniform vec3 uTo;
out vec4 outColor;

// 8x8 Bayer matrix threshold in [0,1) via the bit-interleave identity
float bayer(ivec2 px) {
  int x = px.x & 7;
  int y = px.y & 7;
  int xc = x ^ y;
  int v = 0;
  for (int bit = 0; bit < 3; bit++) {
    int shift = 2 - bit;
    v |= ((xc >> shift) & 1) << (bit * 2 + 1);
    v |= ((yb >> shift) & 1) << (bit * 2);
  }
  return (float(v) + 0.5) / 64.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  // drifting radial + diagonal gradient field with a soft interference term
  float t = uTime * 0.25;
  vec2 c = vec2(0.5 + 0.18 * sin(t * 1.3), 0.45 + 0.2 * cos(t * 0.9));
  float radial = distance(uv * uScale, c * uScale) * 1.4;
  float diagonal = (uv.x + uv.y) * 0.35 + 0.12 * sin(t + uv.y * 6.0);
  float g = clamp(mix(diagonal, radial, 0.55), 0.0, 1.0);
  // ordered dither: quantize g against the Bayer threshold
  float threshold = bayer(ivec2(gl_FragCoord.xy));
  float levels = 4.0;
  float q = floor(g * levels + threshold) / levels;
  vec3 col = mix(uFrom, uTo, q);
  outColor = vec4(col, 1.0);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('DitherField shader:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

/** hex (#rrggbb) → linear-ish rgb triple for the shader uniform. */
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return [0.5, 0.5, 0.5]
  const int = Number.parseInt(m[1], 16)
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255]
}

export function DitherField(props: DitherFieldProps) {
  const [own, rest] = splitProps(props, [
    'from',
    'to',
    'speed',
    'scale',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 320
  const height = () => own.height ?? 200
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const speed = () => (reduced ? 0 : (own.speed ?? 1))

  const [supported, setSupported] = createSignal<boolean | null>(null)
  let canvas!: HTMLCanvasElement
  let gl: WebGL2RenderingContext | null = null
  let program: WebGLProgram | null = null
  let raf = 0
  const t0 = performance.now()

  const draw = () => {
    if (!gl || !program) return
    gl.viewport(0, 0, width(), height())
    gl.useProgram(program)
    const uRes = gl.getUniformLocation(program, 'uRes')
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uScale = gl.getUniformLocation(program, 'uScale')
    const uFrom = gl.getUniformLocation(program, 'uFrom')
    const uTo = gl.getUniformLocation(program, 'uTo')
    gl.uniform2f(uRes, width(), height())
    gl.uniform1f(uTime, ((performance.now() - t0) / 1000) * speed())
    gl.uniform1f(uScale, own.scale ?? 1)
    gl.uniform3fv(uFrom, hexToRgb(own.from ?? '#0e7490'))
    gl.uniform3fv(uTo, hexToRgb(own.to ?? '#d97706'))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const loop = () => {
    draw()
    raf = requestAnimationFrame(loop)
  }

  onMount(() => {
    gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
    if (!gl) {
      setSupported(false)
      return
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) {
      setSupported(false)
      return
    }
    program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('DitherField link:', gl.getProgramInfoLog(program))
      setSupported(false)
      return
    }
    setSupported(true)
    if (speed() > 0) loop()
    else draw() // frozen frame under reduced motion
    onCleanup(() => {
      cancelAnimationFrame(raf)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    })
  })

  return (
    <figure
      {...rest}
      class={`inline-block ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div
        class="relative overflow-hidden rounded-md"
        style={{ width: `${width()}px`, height: `${height()}px` }}
      >
        <canvas
          ref={canvas}
          width={width()}
          height={height()}
          class={`h-full w-full ${supported() === false ? 'hidden' : ''}`}
        />
        {supported() === false && (
          <div
            class="flex h-full w-full items-center justify-center text-xs text-gray-400"
            style={{
              background:
                'repeating-conic-gradient(oklch(0.2 0.02 250) 0% 25%, oklch(0.28 0.03 250) 0% 50%) 0 / 8px 8px',
            }}
          >
            WebGL2 unavailable — checker fallback
          </div>
        )}
        {supported() === null && (
          <div class="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-gray-500">
            probing WebGL2…
          </div>
        )}
      </div>
      {own.label !== undefined && (
        <figcaption class="mt-1.5 text-xs text-gray-400">
          {own.label}{' '}
          <span class="font-mono text-[10px] text-gray-500">
            8×8 Bayer · {width()}×{height()}
          </span>
        </figcaption>
      )}
    </figure>
  )
}

export default DitherField
