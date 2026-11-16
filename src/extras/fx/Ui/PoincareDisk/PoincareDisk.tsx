// solid-fx FX widget — original component (not a port). WebGL2 Poincaré
// disk: a tree embedded in the hyperbolic plane, navigated by Möbius disc
// automorphisms — clicking a node translates it to the center while the
// rest of the structure compresses exponentially toward the rim (research
// 04 #1, adopt path).
//
// Architecture note: all Möbius transforms run on the CPU per frame
// (transformed geodesic circles m/r + node positions/radii are uploaded as
// uniform arrays); the fragment loop is ~10 flops per edge, fully
// branchless. SwiftShader miscompiles conditionals and array reads inside
// fragment loops (whole loops silently stop iterating — black frame), so
// the fragment stage must stay branch-free (see the min() comment below).
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface PoincareDiskProps {
  /** Children per node (default 2). */
  branches?: number
  /** Tree depth (default 4; edges are clamped to 48 for the uniform budget). */
  depth?: number
  /** Disk diameter in px (default 360). */
  size?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

type V2 = [number, number]

interface HNode {
  pos: V2
  radius: number
  depth: number
}

interface HEdge {
  /** ideal boundary endpoints of the geodesic through the two nodes */
  ea: V2
  eb: V2
}

/** Orthogonal circle through two interior points → its ideal boundary endpoints. */
function geodesicEndPoints(p: V2, q: V2): [V2, V2] {
  const pLen = Math.hypot(p[0], p[1])
  const qLen = Math.hypot(q[0], q[1])
  // geodesics touching the origin are diameters: endpoints ± the direction
  if (pLen < 1e-9 || qLen < 1e-9) {
    const dir = pLen >= qLen ? p : q
    const dLen = Math.hypot(dir[0], dir[1]) || 1
    return [
      [dir[0] / dLen, dir[1] / dLen],
      [-dir[0] / dLen, -dir[1] / dLen],
    ]
  }
  // center c solves 2(p·c) = |p|²+1 and 2(q·c) = |q|²+1
  const det = 2 * (p[0] * q[1] - p[1] * q[0])
  if (Math.abs(det) < 1e-9) {
    // collinear with origin → diameter case
    const mx = p[0] + q[0]
    const my = p[1] + q[1]
    const ml = Math.hypot(mx, my) || 1
    return [
      [mx / ml, my / ml],
      [-mx / ml, -my / ml],
    ]
  }
  const b0 = (p[0] * p[0] + p[1] * p[1] + 1) / 2
  const b1 = (q[0] * q[0] + q[1] * q[1] + 1) / 2
  const cx = (b0 * q[1] - p[1] * b1) / det
  const cy = (p[0] * b1 - b0 * q[0]) / det
  const rho = Math.hypot(cx, cy)
  const gamma = Math.atan2(cy, cx)
  const s = 1 / rho
  const t = Math.sqrt(Math.max(0, 1 - s * s))
  const cg = Math.cos(gamma)
  const sg = Math.sin(gamma)
  return [
    [s * cg - t * sg, s * sg + t * cg],
    [s * cg + t * sg, s * sg - t * cg],
  ]
}

function layoutTree(branches: number, maxDepth: number): { nodes: HNode[]; edges: HEdge[] } {
  const rng = mulberry32(0x9017)
  const nodes: HNode[] = [{ pos: [0, 0], radius: 0.02, depth: 0 }]
  const edges: HEdge[] = []
  type QItem = { pos: V2; depth: number; wedge: [number, number] }
  const queue: QItem[] = [{ pos: [0, 0], depth: 0, wedge: [-Math.PI, Math.PI] }]
  while (queue.length > 0) {
    const item = queue.shift() as QItem
    if (item.depth >= maxDepth) continue
    const width = (item.wedge[1] - item.wedge[0]) / branches
    for (let k = 0; k < branches; k++) {
      const wa = item.wedge[0] + k * width
      const angle = wa + width / 2 + (rng() - 0.5) * width * 0.3
      const r = Math.tanh((item.depth + 1) * 0.55)
      const childPos: V2 = [r * Math.cos(angle), r * Math.sin(angle)]
      const child: HNode = {
        pos: childPos,
        radius: 0.02 * (1 - r * r) + 0.004,
        depth: item.depth + 1,
      }
      nodes.push(child)
      const [ea, eb] = geodesicEndPoints(item.pos, childPos)
      edges.push({ ea, eb })
      queue.push({ pos: childPos, depth: item.depth + 1, wedge: [wa, wa + width] })
    }
  }
  return { nodes, edges }
}

const VERT = `#version 300 es
const vec2 pos[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main() { gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
#define N_NODES @@NNODES@@
#define N_EDGES @@NEDGES@@
uniform vec2 uRes;
uniform vec2 uFocus;          // complex focus a (the node currently centered)
uniform vec4 uNodeT[N_NODES]; // transformed: xy node pos, z disc radius, w depth
uniform vec4 uGeod[N_EDGES];  // transformed geodesic: xy circle center, z radius
                              // (z < 0 marks a diameter; xy then holds its direction)
uniform float uAA;            // anti-alias width in world units
out vec4 outColor;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * min(uRes.x, uRes.y));
  vec2 z = uv * 0.97;
  float diskMask = 1.0 - smoothstep(0.965, 0.985, length(z));
  // the focus transform was already applied to the uniforms on the CPU
  vec2 zt = z;

  // nearest geodesic — branchless: r < 0 selects the diameter line form
  float dEdge = 1e9;
  for (int i = 0; i < N_EDGES; i++) {
    vec4 g = uGeod[i];
    float dCircle = abs(length(zt - g.xy) - g.z);
    float dLine = abs(g.x * zt.y - g.y * zt.x);
    dEdge = min(dEdge, mix(dLine, dCircle, step(0.0, g.z)));
  }

  // nearest node disc
  float dNode = 1e9;
  for (int i = 0; i < N_NODES; i++) {
    vec4 n = uNodeT[i];
    dNode = min(dNode, length(zt - n.xy) - n.z);
  }

  // palette: deep slate disk, cyan hairlines with distance glow, amber nodes
  vec3 col = vec3(0.055, 0.065, 0.085);
  float edgeGlow = exp(-dEdge * 26.0);
  col = mix(col, vec3(0.16, 0.45, 0.55), edgeGlow * 0.55);
  float edgeLine = 1.0 - smoothstep(0.0, uAA, dEdge - uAA * 0.5);
  col = mix(col, vec3(0.45, 0.78, 0.85), edgeLine * 0.85);
  float nodeDot = 1.0 - smoothstep(0.0, uAA, dNode);
  col = mix(col, vec3(0.95, 0.78, 0.42), nodeDot);
  // focus ring: hyperbolic circles around the focus are euclidean circles
  // centered at the focus in the *original* frame
  float ringD = abs(length(z - uFocus) - 0.22);
  col = mix(col, vec3(0.55, 0.6, 0.65), (1.0 - smoothstep(0.0, uAA * 2.0, ringD)) * 0.35);
  // rim
  col *= mix(0.35, 1.0, diskMask);

  outColor = vec4(col * diskMask, 1.0);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('PoincareDisk shader:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

const MAX_EDGES = 48

export function PoincareDisk(props: PoincareDiskProps) {
  const [own, rest] = splitProps(props, [
    'branches',
    'depth',
    'size',
    'label',
    'class',
    'className',
    'style',
  ])

  const size = () => own.size ?? 360

  const [supported, setSupported] = createSignal<boolean | null>(null)
  const [focusLabel, setFocusLabel] = createSignal('root')
  const [hoverLabel, setHoverLabel] = createSignal('—')
  const [focused, setFocused] = createSignal(false)

  let canvas!: HTMLCanvasElement
  let gl: WebGL2RenderingContext | null = null
  let program: WebGLProgram | null = null
  let raf = 0
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const tree = layoutTree(Math.min(4, own.branches ?? 2), own.depth ?? 4)
  const edgeCount = Math.min(MAX_EDGES, tree.edges.length)
  const nodeCount = tree.nodes.length
  const edges = tree.edges.slice(0, edgeCount)
  let focusTarget: V2 = [0, 0]
  let focusCurrent: V2 = [0, 0]

  const uniforms = new Map<string, WebGLUniformLocation | null>()
  const loc = (name: string) => {
    const g = gl
    const prog = program
    if (!g || !prog) return null
    if (!uniforms.has(name)) uniforms.set(name, g.getUniformLocation(prog, name))
    return uniforms.get(name) ?? null
  }

  const cmul = (a: V2, b: V2): V2 => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]

  /** disc automorphism moving a to 0: φ_a(z) = (z − a) / (1 − āz) */
  const phi = (z: V2, a: V2): V2 => {
    const num: V2 = [z[0] - a[0], z[1] - a[1]]
    const cz = cmul([a[0], -a[1]], z)
    const den: V2 = [1 - cz[0], -cz[1]]
    // full complex division — componentwise num/den is wrong math and blows
    // up on the (1, ±0) denominator at a = 0
    const d = den[0] * den[0] + den[1] * den[1]
    return [(num[0] * den[0] + num[1] * den[1]) / d, (num[1] * den[0] - num[0] * den[1]) / d]
  }

  // CPU-side per-frame transformed geometry, uploaded every frame
  const geodData = new Float32Array(edgeCount * 4)
  const nodeData = new Float32Array(nodeCount * 4)

  const transformGeometry = () => {
    const a = focusCurrent
    const a2 = 1 - (a[0] * a[0] + a[1] * a[1])
    for (let i = 0; i < edgeCount; i++) {
      const ea = phi(edges[i].ea, a)
      const eb = phi(edges[i].eb, a)
      const dotUV = ea[0] * eb[0] + ea[1] * eb[1]
      if (dotUV < -0.9995) {
        // antipodal ideal points = diameter geodesic: encode the direction,
        // flagged by r = -1 (the fragment loop picks the line form)
        geodData.set([ea[0], ea[1], -1, 0], i * 4)
      } else {
        const mx = (ea[0] + eb[0]) / (1 + dotUV)
        const my = (ea[1] + eb[1]) / (1 + dotUV)
        const r = Math.sqrt(Math.max(mx * mx + my * my - 1, 1e-6))
        geodData.set([mx, my, r, 0], i * 4)
      }
    }
    tree.nodes.forEach((n, i) => {
      const np = phi(n.pos, a)
      // euclidean radii scale by |φ'(n)| = (1 − |a|²) / |1 − ān|
      const cn = cmul([a[0], -a[1]], n.pos)
      const den = Math.max(1e-3, Math.hypot(1 - cn[0], cn[1]))
      const rr = n.radius * (a2 / den)
      nodeData.set([np[0], np[1], rr, n.depth], i * 4)
    })
  }

  const render = () => {
    const g = gl
    if (!g || !program) return
    if (!reduced) tickFocus()
    transformGeometry()
    g.viewport(0, 0, size(), size())
    g.useProgram(program)
    g.uniform2f(loc('uRes'), size(), size())
    g.uniform2f(loc('uFocus'), focusCurrent[0], focusCurrent[1])
    g.uniform1f(loc('uAA'), 1.6 / size())
    g.uniform4fv(loc('uNodeT'), nodeData)
    g.uniform4fv(loc('uGeod'), geodData)
    g.drawArrays(g.TRIANGLES, 0, 3)
  }

  // continuous presentation: re-present every frame so the compositor never
  // falls back to a cleared buffer (single-draw canvases go black in CI)
  const loop = () => {
    render()
    raf = requestAnimationFrame(loop)
  }

  // per-frame easing toward the focus target (driven by the RAF loop)
  const tickFocus = () => {
    const ease = 0.14
    focusCurrent = [
      focusCurrent[0] + (focusTarget[0] - focusCurrent[0]) * ease,
      focusCurrent[1] + (focusTarget[1] - focusCurrent[1]) * ease,
    ]
  }

  const seekFocus = (target: V2, label: string) => {
    focusTarget = target
    setFocused(!(target[0] === 0 && target[1] === 0))
    setFocusLabel(label)
    if (reduced) {
      focusCurrent = [...target] as V2
      render()
    }
  }

  const nearestNode = (worldZ: V2): number => {
    let best = -1
    let bestD = Number.POSITIVE_INFINITY
    tree.nodes.forEach((n, i) => {
      const np = phi(n.pos, focusCurrent)
      const d = Math.hypot(worldZ[0] - np[0], worldZ[1] - np[1]) - n.radius
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best
  }

  const screenToWorld = (event: PointerEvent): V2 => {
    const rect = canvas.getBoundingClientRect()
    const half = rect.width / 2
    return [
      ((event.clientX - rect.left - half) / half) * 0.97,
      -((event.clientY - rect.top - half) / half) * 0.97,
    ]
  }

  let dragging = false
  let lastClient: V2 = [0, 0]
  let downClient: V2 = [0, 0]

  const onPointerDown = (event: PointerEvent) => {
    ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
    dragging = true
    lastClient = [event.clientX, event.clientY]
    downClient = [event.clientX, event.clientY]
  }

  const onPointerMove = (event: PointerEvent) => {
    if (dragging) {
      const rect = canvas.getBoundingClientRect()
      const scale = 1.9 / rect.width
      focusTarget = [
        Math.max(-0.96, Math.min(0.96, focusTarget[0] + (event.clientX - lastClient[0]) * scale)),
        Math.max(-0.96, Math.min(0.96, focusTarget[1] - (event.clientY - lastClient[1]) * scale)),
      ]
      lastClient = [event.clientX, event.clientY]
      return
    }
    const world = screenToWorld(event)
    const idx = nearestNode(world)
    setHoverLabel(idx >= 0 ? `node ${idx} · depth ${tree.nodes[idx].depth}` : '—')
  }

  const onPointerUp = (event: PointerEvent) => {
    dragging = false
    ;(event.currentTarget as HTMLCanvasElement).releasePointerCapture(event.pointerId)
    // short clicks are navigation: focus the node under the pointer
    const moved = Math.hypot(event.clientX - downClient[0], event.clientY - downClient[1])
    if (moved > 6) return
    const world = screenToWorld(event)
    if (Math.hypot(world[0], world[1]) <= 0.97) {
      const idx = nearestNode(world)
      if (idx >= 0) seekFocus(tree.nodes[idx].pos, `node ${idx} (depth ${tree.nodes[idx].depth})`)
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const step = 0.08
    let next: V2 | null = null
    if (event.key === 'ArrowLeft') next = [focusTarget[0] - step, focusTarget[1]]
    if (event.key === 'ArrowRight') next = [focusTarget[0] + step, focusTarget[1]]
    if (event.key === 'ArrowUp') next = [focusTarget[0], focusTarget[1] + step]
    if (event.key === 'ArrowDown') next = [focusTarget[0], focusTarget[1] - step]
    if (event.key === 'Home' || event.key === 'Escape') next = [0, 0]
    if (!next) return
    event.preventDefault()
    seekFocus([next[0], next[1]], next[0] === 0 && next[1] === 0 ? 'root' : focusLabel())
  }

  onMount(() => {
    gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      // single-frame rest states must survive re-compositing in headless
      preserveDrawingBuffer: true,
    })
    if (!gl) {
      setSupported(false)
      return
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(
      gl,
      gl.FRAGMENT_SHADER,
      FRAG.replace('@@NNODES@@', String(nodeCount)).replace('@@NEDGES@@', String(edgeCount)),
    )
    if (!vs || !fs) {
      setSupported(false)
      return
    }
    program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('PoincareDisk link:', gl.getProgramInfoLog(program))
      setSupported(false)
      return
    }
    setSupported(true)
    if (reduced) {
      render()
    } else {
      loop()
    }
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
        class="relative overflow-hidden rounded-lg"
        style={{ width: `${size()}px`, height: `${size()}px` }}
      >
        <canvas
          ref={canvas}
          width={size()}
          height={size()}
          class={`h-full w-full touch-none ${supported() === false ? 'hidden' : ''}`}
          role="application"
          aria-label={`${own.label ?? 'Poincaré disk'} — ${nodeCount} hyperbolic nodes, ${edgeCount} geodesics. Click or drag to navigate.`}
          tabindex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
        {supported() === false && (
          <div class="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-gray-400">
            WebGL2 unavailable — hyperbolic view disabled
          </div>
        )}
        {supported() === null && (
          <div class="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-gray-500">
            probing WebGL2…
          </div>
        )}
      </div>
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'Poincaré disk'}</span>
        <span class="font-mono text-[10px] text-gray-500" aria-live="polite">
          {hoverLabel() !== '—' ? hoverLabel() : `focus: ${focusLabel()}`} · {nodeCount} nodes /{' '}
          {edgeCount} geodesics
        </span>
      </figcaption>
    </figure>
  )
}

export default PoincareDisk
