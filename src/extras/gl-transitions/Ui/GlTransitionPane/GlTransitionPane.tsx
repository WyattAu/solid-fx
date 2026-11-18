// solid-fx FX widget — original component (not a port).
// GLSL transition pane: two procedural scenes cross-transitioned by
// verbatim gl-transitions bodies (MIT — https://github.com/gl-transitions,
// embedded as string constants per their file-per-transition layout; see
// LICENSE-SOURCES.md). `progress` + `getFromColor`/`getToColor` follow the
// gl-transitions wrapper convention; the scene functions feed the hook.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'

export interface GlTransitionPaneProps {
  /** Transition (default 'wind'). */
  transition?: 'wind' | 'swap'
  /** Auto-drive the transition in a loop (default true; off under reduced motion). */
  autoPlay?: boolean
  /** Seconds per full transition cycle (default 6). */
  cycleSeconds?: number
  /** Canvas width in px (default 420). */
  width?: number
  /** Canvas height in px (default 260). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const VERT = `#version 300 es
const vec2 pos[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main() { gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0); }`

// scene A (from): cool grid · scene B (to): warm bands — animated procedurally
const SCENES = `vec4 getFromColor(vec2 uv) {
  vec3 a = vec3(0.09, 0.13, 0.20);
  vec2 g = fract(uv * vec2(10.0, 7.0));
  float line = step(0.94, g.x) + step(0.94, g.y);
  return vec4(a + line * 0.10 + uv.y * 0.03, 1.0);
}
vec4 getToColor(vec2 uv) {
  vec3 base = mix(vec3(0.16, 0.09, 0.05), vec3(0.42, 0.24, 0.10), uv.x);
  float bands = 0.5 + 0.5 * sin(uv.y * 26.0);
  return vec4(base + bands * 0.06, 1.0);
}`

const HEAD = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float progress;   // gl-transitions progress uniform
out vec4 outColor;
${SCENES}`

// verbatim gl-transitions bodies (Wind.glsl © gre, Swap.glsl © gre — MIT)
const WIND = `// Author: gre
// License: MIT
// Wind.glsl — ragged wipe; "size" kept at upstream default 0.2
uniform float size; // = 0.2

float rand (vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec4 transition (vec2 uv) {
  float x = uv.x;
  float r = rand(vec2(0, uv.y));
  float m = smoothstep(0.0, -size, x*(1.0-size) + size*r - (progress * (1.0 + size)));
  return mix(
    getFromColor(uv),
    getToColor(uv),
    m
  );
}`

const SWAP = `// Author: gre
// License: MIT
// Swap.glsl — the two scenes swap places in 3D with a floor reflection
const vec4 black = vec4(0.0);
const vec2 boundMin = vec2(0.0, 0.0);
const vec2 boundMax = vec2(1.0, 1.0);

bool inBounds (vec2 p) {
  return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));
}

vec2 project (vec2 p) {
  return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);
}

vec4 bgColor (vec2 p, vec2 pfr, vec2 pto) {
  vec4 c = black;
  pfr = project(pfr);
  if (inBounds(pfr)) {
    c += mix(black, getFromColor(pfr), 0.4 * mix(1.0, 0.0, pfr.y));
  }
  pto = project(pto);
  if (inBounds(pto)) {
    c += mix(black, getToColor(pto), 0.4 * mix(1.0, 0.0, pto.y));
  }
  return c;
}

vec4 transition(vec2 p) {
  vec2 pfr, pto = vec2(-1.);
  float depth = 3.0;
  float perspective = 0.2;

  float sizeA = mix(1.0, depth, progress);
  float persp = perspective * progress;
  pfr = (p + vec2(-0.0, -0.5)) * vec2(sizeA/(1.0-perspective*progress), sizeA/(1.0-sizeA*persp*p.x)) + vec2(0.0, 0.5);

  sizeA = mix(1.0, depth, 1.-progress);
  persp = perspective * (1.-progress);
  pto = (p + vec2(-1.0, -0.5)) * vec2(sizeA/(1.0-perspective*(1.0-progress)), sizeA/(1.0-sizeA*persp*(0.5-p.x))) + vec2(1.0, 0.5);

  if (progress < 0.5) {
    if (inBounds(pfr)) return getFromColor(pfr);
    if (inBounds(pto)) return getToColor(pto);
  }
  if (inBounds(pto)) return getToColor(pto);
  if (inBounds(pfr)) return getFromColor(pfr);
  return bgColor(p, pfr, pto);
}`

const BODIES: Record<'wind' | 'swap', string> = { wind: WIND, swap: SWAP }

function buildFrag(name: 'wind' | 'swap'): string {
  return `${HEAD}
${BODIES[name]}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float animated = uTime * 0.1;
  vec4 c = transition(uv + vec2(0.0, animated * 0.02));
  outColor = vec4(c.rgb, 1.0);
}`
}

export function GlTransitionPane(props: GlTransitionPaneProps) {
  const [own, rest] = splitProps(props, [
    'transition',
    'autoPlay',
    'cycleSeconds',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 420
  const height = () => own.height ?? 260
  const transition = () => own.transition ?? 'wind'
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const autoPlay = () => (own.autoPlay ?? true) && !reduced

  const [supported, setSupported] = createSignal<boolean | null>(null)
  const [progressLabel, setProgressLabel] = createSignal('0%')
  let canvas!: HTMLCanvasElement
  let gl: WebGL2RenderingContext | null = null
  let program: WebGLProgram | null = null
  let raf = 0
  const t0 = performance.now()

  const render = (progress: number, time: number) => {
    if (!gl || !program) return
    gl.viewport(0, 0, width(), height())
    gl.useProgram(program)
    gl.uniform2f(gl.getUniformLocation(program, 'uRes'), width(), height())
    gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time)
    gl.uniform1f(gl.getUniformLocation(program, 'progress'), progress)
    if (transition() === 'wind') {
      const sizeLoc = gl.getUniformLocation(program, 'size')
      if (sizeLoc) gl.uniform1f(sizeLoc, 0.2) // upstream default
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  onMount(() => {
    gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
    if (!gl) {
      setSupported(false)
      return
    }
    const g = gl
    const mk = (type: number, src: string) => {
      const sh = g.createShader(type)
      if (!sh) return null
      g.shaderSource(sh, src)
      g.compileShader(sh)
      if (!g.getShaderParameter(sh, g.COMPILE_STATUS)) {
        console.error('GlTransitionPane shader:', g.getShaderInfoLog(sh))
        return null
      }
      return sh
    }
    const vs = mk(g.VERTEX_SHADER, VERT)
    const fs = mk(g.FRAGMENT_SHADER, buildFrag(transition()))
    if (!vs || !fs) {
      setSupported(false)
      return
    }
    program = g.createProgram()
    g.attachShader(program, vs)
    g.attachShader(program, fs)
    g.linkProgram(program)
    if (!g.getProgramParameter(program, g.LINK_STATUS)) {
      console.error('GlTransitionPane link:', g.getProgramInfoLog(program))
      setSupported(false)
      return
    }
    setSupported(true)

    const frame = () => {
      const cycle = own.cycleSeconds ?? 6
      const ph = (((performance.now() - t0) / 1000) % cycle) / cycle
      const progress = ph < 0.5 ? ph * 2 : 2 - ph * 2
      render(progress, (performance.now() - t0) / 1000)
      setProgressLabel(`${Math.round(progress * 100)}%`)
      raf = requestAnimationFrame(frame)
    }

    if (autoPlay()) frame()
    else render(0.5, 0)
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
      <canvas
        ref={canvas}
        width={width()}
        height={height()}
        class={`w-full rounded-lg ${supported() === false ? 'hidden' : ''}`}
        style={{ 'max-width': `${width()}px` }}
        role="img"
        aria-label={`${own.label ?? 'gl-transitions pane'} — ${transition()} transition, ${progressLabel()} progress`}
      />
      {supported() === false && (
        <div
          class="flex items-center justify-center rounded-lg text-xs text-gray-400"
          style={{
            width: `${width()}px`,
            height: `${height()}px`,
            background: 'linear-gradient(120deg, oklch(0.18 0.02 250), oklch(0.28 0.04 60))',
          }}
        >
          WebGL2 unavailable — static fallback
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
        <span>{own.label ?? 'gl-transitions pane'}</span>
        <span class="font-mono text-[10px] text-gray-500" aria-live="polite">
          {transition()} · {progressLabel()}
        </span>
      </figcaption>
    </figure>
  )
}

export default GlTransitionPane
