// solid-fx FX widget — original component (not a port). WebGL2 ping-pong
// Gray-Scott reaction-diffusion: two RGBA16F targets, 5-tap Laplacian,
// multiple sim steps per frame, pointer injects the U chemical. Capability
// probe falls back to a static gradient when float render targets are
// unavailable (headless/software GL).
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'

export interface ReactionDiffusionProps {
  /** Gray-Scott feed rate (default 0.037 — "mitosis" regime). */
  feed?: number
  /** Gray-Scott kill rate (default 0.06). */
  kill?: number
  /** Simulation steps per frame (default 10). */
  steps?: number
  /** Injection brush radius in texels (default 7). */
  brush?: number
  /** Canvas width in px (default 360). */
  width?: number
  /** Canvas height in px (default 240). */
  height?: number
  /** Start paused — also forced when prefers-reduced-motion is set. */
  paused?: boolean
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const VERT = `#version 300 es
const vec2 pos[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main() { gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0); }`

const SIM_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uPointer;
uniform float uBrush;
uniform float uFeed;
uniform float uKill;
uniform float uInject;
out vec4 outState;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec4 s = texelFetch(uState, c, 0);
  vec4 l = texelFetch(uState, c + ivec2(-1, 0), 0);
  vec4 r = texelFetch(uState, c + ivec2(1, 0), 0);
  vec4 d = texelFetch(uState, c + ivec2(0, -1), 0);
  vec4 u = texelFetch(uState, c + ivec2(0, 1), 0);
  // 5-point Laplacian (weights 0.2 / 0.05)
  vec2 lap = (l.xy + r.xy + d.xy + u.xy) * 0.2 - s.xy;
  vec2 diff = vec2(0.16, 0.08) * lap;
  float reaction = s.x * s.y * s.y;
  vec2 next = s.xy + diff - reaction * vec2(1.0, -1.0) + uFeed * (1.0 - s.xy) * vec2(1.0, 0.0);
  next = clamp(next, 0.0, 1.0);
  // pointer injection: seed U inside the brush
  vec2 px = (gl_FragCoord.xy) * uTexel;
  float dist = distance(px, uPointer);
  if (uInject > 0.5 && dist < uBrush) next.x = 0.9;
  outState = vec4(next, s.zw);
}`

const DRAW_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
out vec4 outColor;
void main() {
  vec4 s = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  float v = clamp(s.y * 6.0, 0.0, 1.0);
  vec3 base = vec3(0.075, 0.086, 0.11);   // slate floor
  vec3 mid = vec3(0.075, 0.42, 0.55);     // teal bloom
  vec3 tip = vec3(0.9, 0.85, 0.6);        // warm crest
  vec3 col = mix(base, mid, smoothstep(0.0, 0.55, v));
  col = mix(col, tip, smoothstep(0.55, 1.0, v));
  outColor = vec4(col, 1.0);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('ReactionDiffusion shader:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function ReactionDiffusion(props: ReactionDiffusionProps) {
  const [own, rest] = splitProps(props, [
    'feed',
    'kill',
    'steps',
    'brush',
    'width',
    'height',
    'paused',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 360
  const height = () => own.height ?? 240

  const [supported, setSupported] = createSignal<boolean | null>(null) // null = probing
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [running, setRunning] = createSignal(!(own.paused ?? false) && !reduced)
  const [generations, setGenerations] = createSignal(0)

  let canvas!: HTMLCanvasElement
  let gl: WebGL2RenderingContext | null = null
  let program: WebGLProgram | null = null
  let drawProgram: WebGLProgram | null = null
  let texA: WebGLTexture | null = null
  let texB: WebGLTexture | null = null
  let fboA: WebGLFramebuffer | null = null
  let fboB: WebGLFramebuffer | null = null
  let raf = 0
  const uniforms = new Map<string, WebGLUniformLocation | null>()

  const simStep = () => {
    const g = gl
    if (!g || !program || !texA || !texB || !fboA || !fboB) return
    const prog = program
    g.useProgram(prog)
    g.bindFramebuffer(g.FRAMEBUFFER, fboB)
    g.viewport(0, 0, width(), height())
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, texA)
    const loc = (name: string) => {
      if (!uniforms.has(name)) uniforms.set(name, g.getUniformLocation(prog, name))
      return uniforms.get(name) ?? null
    }
    g.uniform1i(loc('uState'), 0)
    g.uniform2f(loc('uTexel'), 1 / width(), 1 / height())
    g.uniform1f(loc('uFeed'), own.feed ?? 0.037)
    g.uniform1f(loc('uKill'), own.kill ?? 0.06)
    const steps = own.steps ?? 10
    g.uniform1f(loc('uInject'), pointerActive ? 1 : 0)
    g.uniform2f(loc('uPointer'), pointerX, pointerY)
    g.uniform1f(loc('uBrush'), own.brush ?? 7)
    for (let i = 0; i < steps; i++) {
      g.drawArrays(g.TRIANGLES, 0, 3)
      // ping-pong
      const t: WebGLTexture | null = texA
      texA = texB
      texB = t
      const f: WebGLFramebuffer | null = fboA
      fboA = fboB
      fboB = f
      g.bindTexture(g.TEXTURE_2D, texA)
    }
  }

  const draw = () => {
    const g = gl
    if (!g || !drawProgram || !texA) return
    g.useProgram(drawProgram)
    g.bindFramebuffer(g.FRAMEBUFFER, null)
    g.viewport(0, 0, width(), height())
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, texA)
    const loc = g.getUniformLocation(drawProgram, 'uState')
    g.uniform1i(loc, 0)
    g.drawArrays(g.TRIANGLES, 0, 3)
  }

  let pointerActive = false
  let pointerX = 0
  let pointerY = 0

  const seed = () => {
    const g = gl
    if (!g || !texA) return
    const data = new Float32Array(width() * height() * 4)
    // deterministic seed: v=1 patches from mulberry32
    let s = 0x5eed
    const rng = () => {
      s = (s + 0x6d2b79f5) | 0
      let t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 1
      data[i + 3] = 1
    }
    const blobs = 5
    for (let b = 0; b < blobs; b++) {
      const cx = rng() * width()
      const cy = rng() * height()
      const rad = 4 + rng() * 8
      for (let y = Math.max(0, cy - rad) | 0; y < Math.min(height(), cy + rad); y++) {
        for (let x = Math.max(0, cx - rad) | 0; x < Math.min(width(), cx + rad); x++) {
          if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= rad * rad) {
            const k = (y * width() + x) * 4
            data[k] = 0.35
            data[k + 1] = 1
          }
        }
      }
    }
    for (const tex of [texA, texB]) {
      g.bindTexture(g.TEXTURE_2D, tex)
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA16F, width(), height(), 0, g.RGBA, g.FLOAT, data)
    }
    setGenerations(0)
  }

  const frame = () => {
    if (!running()) return
    simStep()
    draw()
    setGenerations(g => g + (own.steps ?? 10))
  }

  const loop = () => {
    frame()
    raf = requestAnimationFrame(loop)
  }

  onMount(() => {
    gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
    const g = gl
    const floatOk =
      g &&
      (g.getExtension('EXT_color_buffer_float') || g.getExtension('EXT_color_buffer_half_float'))
    if (!g || !floatOk) {
      setSupported(false)
      return
    }
    const vs = compile(g, g.VERTEX_SHADER, VERT)
    const simFs = compile(g, g.FRAGMENT_SHADER, SIM_FRAG)
    const drawFs = compile(g, g.FRAGMENT_SHADER, DRAW_FRAG)
    if (!vs || !simFs || !drawFs) {
      setSupported(false)
      return
    }
    const link = (fs: WebGLShader) => {
      const p = g.createProgram()
      g.attachShader(p, vs)
      g.attachShader(p, fs)
      g.linkProgram(p)
      return g.getProgramParameter(p, g.LINK_STATUS) ? p : null
    }
    program = link(simFs)
    drawProgram = link(drawFs)
    if (!program || !drawProgram) {
      setSupported(false)
      return
    }
    const makeTex = () => {
      const t = g.createTexture()
      g.bindTexture(g.TEXTURE_2D, t)
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST)
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST)
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE)
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
      return t
    }
    texA = makeTex()
    texB = makeTex()
    const makeFbo = (tex: WebGLTexture | null) => {
      const f = g.createFramebuffer()
      g.bindFramebuffer(g.FRAMEBUFFER, f)
      g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0)
      return f
    }
    fboA = makeFbo(texA)
    fboB = makeFbo(texB)
    seed()
    setSupported(true)
    if (running()) {
      loop()
    } else {
      // static first frame even when paused (reduced motion / paused prop)
      simStep()
      draw()
    }
    onCleanup(() => {
      cancelAnimationFrame(raf)
      g.getExtension('WEBGL_lose_context')?.loseContext()
    })
  })

  const toggle = () => {
    const next = !running()
    setRunning(next)
    if (next && supported()) {
      cancelAnimationFrame(raf)
      loop()
    }
  }

  const onPointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const sx = width() / rect.width
    pointerX = ((event.clientX - rect.left) * sx) / width()
    pointerY = 1 - ((event.clientY - rect.top) * (height() / rect.height)) / height()
    pointerActive = true
    if (!running()) {
      // single-step on drag while paused: chemistry still responds
      simStep()
      draw()
    }
  }

  const effectiveRunning = () => running() && !reduced

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
          onPointerDown={onPointer}
          onPointerMove={onPointer}
          onPointerLeave={() => {
            pointerActive = false
          }}
        />
        {supported() === false && (
          <div
            class="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-gray-400"
            style={{
              background:
                'radial-gradient(circle at 30% 40%, rgba(14,116,144,0.5), transparent 60%), radial-gradient(circle at 70% 65%, rgba(180,150,60,0.3), transparent 55%)',
            }}
          >
            WebGL2 float targets unavailable — static fallback
          </div>
        )}
        {supported() === null && (
          <div class="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-gray-500">
            probing WebGL2…
          </div>
        )}
      </div>
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'Gray-Scott reaction-diffusion'}</span>
        <span class="flex items-center gap-2 font-mono text-[10px] text-gray-500">
          <span>gen {generations().toLocaleString()}</span>
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={toggle}
          >
            {effectiveRunning() ? 'pause' : 'run'}
          </button>
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={() => seed()}
          >
            reseed
          </button>
        </span>
      </figcaption>
    </figure>
  )
}

export default ReactionDiffusion
