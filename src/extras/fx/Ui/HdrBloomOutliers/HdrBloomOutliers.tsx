// solid-fx FX widget — original component (not a port).
// HDR outlier bloom (research 03 #72): a scatter rendered into an RGBA16F
// float framebuffer, outliers written at HDR intensity (>3σ equivalents),
// then bright-pass → separable gaussian blur → additive composite with a
// Reinhard curve. Extreme values physically radiate light onto neighboring
// cells — exploiting pre-attentive luminance vision.
//
// Capability probe: requires EXT_color_buffer_float or
// EXT_color_buffer_half_float (RGBA16F render targets). Canvas2D fallback
// pre-bakes the same glow with radial gradients.
import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface HdrBloomOutliersProps {
  /** Point count (default 340). */
  count?: number
  /** Outlier count — the points that bloom (default 7). */
  outlierCount?: number
  /** RNG seed — identical clouds across users (default 1). */
  seed?: number
  /** Bloom strength (default 0.9). */
  bloomStrength?: number
  /** Canvas width in px (default 480). */
  width?: number
  /** Canvas height in px (default 300). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface Pt {
  x: number
  y: number
  intensity: number // 1.0 normal, 2.0+ outliers (HDR)
  outlier: boolean
}

const VERT_SCENE = `#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in float aIntensity;
uniform vec2 uRes;
out float vIntensity;
void main() {
  gl_Position = vec4(aPos * 2.0 - 0.5, 0.0, 1.0);
  gl_PointSize = aIntensity > 1.5 ? 7.0 : 3.0;
  vIntensity = aIntensity;
}`

const FRAG_SCENE = `#version 300 es
precision highp float;
in float vIntensity;
out vec4 outColor;
void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float d = length(pc) * 2.0;
  float core = smoothstep(1.0, 0.15, d);
  outColor = vec4(vec3(vIntensity) * core, core);
}`

const VERT_FS = `#version 300 es
const vec2 pos[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
  vUv = pos[gl_VertexID] * 0.5 + 0.5;
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}`

const FRAG_BRIGHT = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uThreshold;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec3 c = texture(uTex, vUv).rgb;
  float l = max(max(c.r, c.g), c.b);
  float kept = max(l - uThreshold, 0.0);
  outColor = vec4(c * (kept / max(l, 1e-4)), 1.0);
}`

const FRAG_BLUR = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uDir;
in vec2 vUv;
out vec4 outColor;
void main() {
  // 9-tap gaussian
  vec4 sum = texture(uTex, vUv) * 0.227027;
  vec2 o1 = uDir * 1.3846;
  vec2 o2 = uDir * 3.2308;
  sum += (texture(uTex, vUv + o1) + texture(uTex, vUv - o1)) * 0.316216;
  sum += (texture(uTex, vUv + o2) + texture(uTex, vUv - o2)) * 0.070270;
  outColor = sum;
}`

const FRAG_COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uStrength;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec3 c = texture(uScene, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;
  vec3 hdr = c + bloom * uStrength;
  // Reinhard tonemap back to display range
  vec3 mapped = hdr / (1.0 + hdr);
  outColor = vec4(mapped, 1.0);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('HdrBloomOutliers shader:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function HdrBloomOutliers(props: HdrBloomOutliersProps) {
  const [own, rest] = splitProps(props, [
    'count',
    'outlierCount',
    'seed',
    'bloomStrength',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 480
  const height = () => own.height ?? 300
  const count = () => own.count ?? 340
  const outliers = () => own.outlierCount ?? 7
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [supported, setSupported] = createSignal<boolean | null>(null)
  let canvas!: HTMLCanvasElement
  let gl: WebGL2RenderingContext | null = null
  let raf = 0
  const programs: Record<string, WebGLProgram | null> = {}

  // deterministic cloud: normals + planted outliers
  const cloud = (): Pt[] => {
    const rng = mulberry32((own.seed ?? 1) >>> 0)
    const gauss = () => {
      const u = Math.max(1e-12, rng())
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
    }
    const pts: Pt[] = []
    for (let i = 0; i < count(); i++) {
      pts.push({
        x: Math.min(0.96, Math.max(0.04, 0.5 + gauss() * 0.15)),
        y: Math.min(0.94, Math.max(0.06, 0.5 + gauss() * 0.13)),
        intensity: 0.55 + rng() * 0.1,
        outlier: false,
      })
    }
    for (let k = 0; k < outliers(); k++) {
      const ang = (k / outliers()) * Math.PI * 2 + rng() * 0.5
      const rad = 0.3 + rng() * 0.1
      pts.push({
        x: Math.min(0.95, Math.max(0.05, 0.5 + Math.cos(ang) * rad)),
        y: Math.min(0.92, Math.max(0.08, 0.5 + Math.sin(ang) * rad * 0.8)),
        intensity: 2.2 + rng() * 1.8,
        outlier: true,
      })
    }
    return pts
  }
  const pts = cloud()

  const drawFallback = () => {
    const ctx = fallbackCanvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'oklch(0.12 0.01 250)'
    ctx.fillRect(0, 0, width(), height())
    for (const p of pts) {
      const x = p.x * width()
      const y = p.y * height()
      if (p.outlier) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 18)
        grad.addColorStop(0, 'rgba(253, 224, 71, 0.9)')
        grad.addColorStop(1, 'rgba(253, 224, 71, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, 18, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.55)'
        ctx.fillRect(x - 1, y - 1, 2.2, 2.2)
      }
    }
  }

  let fallbackCanvas!: HTMLCanvasElement

  createEffect(() => {
    if (supported() === false) drawFallback()
  })

  let sceneFbo: WebGLFramebuffer | null = null
  let sceneTex: WebGLTexture | null = null
  let bloomAFbo: WebGLFramebuffer | null = null
  let bloomATex: WebGLTexture | null = null
  let bloomBFbo: WebGLFramebuffer | null = null
  let bloomBTex: WebGLTexture | null = null
  let vbo: WebGLBuffer | null = null

  const render = () => {
    const g = gl
    if (
      !g ||
      !sceneFbo ||
      !programs.scene ||
      !programs.bright ||
      !programs.blur ||
      !programs.composite
    )
      return
    const W = width()
    const H = height()
    const bw = Math.max(32, W >> 2)
    const bh = Math.max(32, H >> 2)
    const prog = programs as Record<string, WebGLProgram>

    // 1. scene → HDR fbo (additive points, outliers at HDR intensity)
    g.bindFramebuffer(g.FRAMEBUFFER, sceneFbo)
    g.viewport(0, 0, W, H)
    g.clearColor(0.04, 0.05, 0.07, 1)
    g.clear(g.COLOR_BUFFER_BIT)
    g.enable(g.BLEND)
    g.blendFunc(g.ONE, g.ONE)
    g.useProgram(programs.scene!)
    g.uniform2f(g.getUniformLocation(prog.scene, 'uRes'), W, H)
    g.drawArrays(g.POINTS, 0, pts.length)
    g.disable(g.BLEND)

    // 2. bright pass + downsample
    g.bindFramebuffer(g.FRAMEBUFFER, bloomAFbo)
    g.viewport(0, 0, bw, bh)
    g.useProgram(prog.bright)
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, sceneTex)
    g.uniform1i(g.getUniformLocation(prog.bright, 'uTex'), 0)
    g.uniform1f(g.getUniformLocation(prog.bright, 'uThreshold'), 0.85)
    g.drawArrays(g.TRIANGLES, 0, 3)

    // 3. blur H then V (ping-pong at quarter res)
    g.useProgram(prog.blur)
    for (const [target, src, dir] of [
      [bloomBFbo, bloomATex, [1 / bw, 0]],
      [bloomAFbo, bloomBTex, [0, 1 / bh]],
    ] as Array<[WebGLFramebuffer | null, WebGLTexture | null, number[]]>) {
      g.bindFramebuffer(g.FRAMEBUFFER, target)
      g.viewport(0, 0, bw, bh)
      g.activeTexture(g.TEXTURE0)
      g.bindTexture(g.TEXTURE_2D, src)
      g.uniform1i(g.getUniformLocation(prog.blur, 'uTex'), 0)
      g.uniform2f(g.getUniformLocation(prog.blur, 'uDir'), dir[0], dir[1])
      g.drawArrays(g.TRIANGLES, 0, 3)
    }

    // 4. composite to screen: scene + bloom, Reinhard
    g.bindFramebuffer(g.FRAMEBUFFER, null)
    g.viewport(0, 0, W, H)
    g.useProgram(prog.composite)
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, sceneTex)
    g.activeTexture(g.TEXTURE1)
    g.bindTexture(g.TEXTURE_2D, bloomATex)
    g.uniform1i(g.getUniformLocation(prog.composite, 'uScene'), 0)
    g.uniform1i(g.getUniformLocation(prog.composite, 'uBloom'), 1)
    g.uniform1f(g.getUniformLocation(prog.composite, 'uStrength'), own.bloomStrength ?? 0.9)
    g.disable(g.BLEND)
    g.drawArrays(g.TRIANGLES, 0, 3)
  }

  const loop = () => {
    render()
    raf = requestAnimationFrame(loop)
  }

  onMount(() => {
    gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
    })
    const floatOk =
      gl &&
      (gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))
    if (!gl || !floatOk) {
      setSupported(false)
      return
    }
    const g = gl

    // programs: scene (points) + 3 fullscreen passes
    const link = (vertSrc: string, fragSrc: string): WebGLProgram | null => {
      const vs = compile(g, g.VERTEX_SHADER, vertSrc)
      const fs = compile(g, g.FRAGMENT_SHADER, fragSrc)
      if (!vs || !fs) return null
      const p = g.createProgram()
      g.attachShader(p, vs)
      g.attachShader(p, fs)
      g.linkProgram(p)
      if (!g.getProgramParameter(p, g.LINK_STATUS)) {
        console.error('HdrBloomOutliers link:', g.getProgramInfoLog(p))
        return null
      }
      return p
    }
    programs.scene = link(VERT_SCENE, FRAG_SCENE)
    programs.bright = link(VERT_FS, FRAG_BRIGHT)
    programs.blur = link(VERT_FS, FRAG_BLUR)
    programs.composite = link(VERT_FS, FRAG_COMPOSITE)
    if (!programs.scene || !programs.bright || !programs.blur || !programs.composite) {
      setSupported(false)
      return
    }

    // point VBO: pos.xy + intensity
    const data = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => {
      data.set([p.x, p.y, p.intensity], i * 3)
    })
    vbo = g.createBuffer()
    g.bindBuffer(g.ARRAY_BUFFER, vbo)
    g.bufferData(g.ARRAY_BUFFER, data, g.STATIC_DRAW)
    g.useProgram(programs.scene!)
    g.bindBuffer(g.ARRAY_BUFFER, vbo)
    g.enableVertexAttribArray(0)
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 12, 0)
    g.enableVertexAttribArray(1)
    g.vertexAttribPointer(1, 1, g.FLOAT, false, 12, 8)

    // HDR textures + FBOs (scene at full res, bloom at quarter)
    const mkTarget = (w: number, h: number): [WebGLTexture, WebGLFramebuffer] => {
      const tex = g.createTexture()
      g.bindTexture(g.TEXTURE_2D, tex)
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA16F, w, h, 0, g.RGBA, g.HALF_FLOAT, null)
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR)
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const fbo = g.createFramebuffer()
      g.bindFramebuffer(g.FRAMEBUFFER, fbo)
      g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0)
      return [tex, fbo]
    }
    ;[sceneTex, sceneFbo] = mkTarget(width(), height())
    ;[bloomATex, bloomAFbo] = mkTarget(width() >> 2, height() >> 2)
    ;[bloomBTex, bloomBFbo] = mkTarget(width() >> 2, height() >> 2)

    setSupported(true)
    if (reduced) {
      render()
    } else {
      loop()
    }
    onCleanup(() => {
      cancelAnimationFrame(raf)
      g.getExtension('WEBGL_lose_context')?.loseContext()
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
        aria-label={`${own.label ?? 'HDR outlier bloom'} — ${pts.length} points, ${outliers()} outliers blooming`}
      />
      {supported() === false && (
        <div class="relative" style={{ width: `${width()}px`, height: `${height()}px` }}>
          <canvas
            ref={fallbackCanvas}
            width={width()}
            height={height()}
            class="w-full rounded-lg"
            style={{ 'max-width': `${width()}px` }}
          />
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
        <span>{own.label ?? 'HDR outlier bloom'}</span>
        <span class="font-mono text-[10px] text-gray-500">
          {pts.length - outliers()} normal · {outliers()} outliers &gt; 3σ · RGBA16F + mip-free blur
        </span>
      </figcaption>
    </figure>
  )
}

export default HdrBloomOutliers
