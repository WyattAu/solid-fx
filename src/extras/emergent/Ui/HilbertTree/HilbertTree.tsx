// solid-fx Emergent widget — original component (not a port).
// Hilbert-curve fractal tree: each tree node paints a contiguous run of
// Hilbert cells proportional to its subtree weight — subtrees stay spatially
// compact at every scale (Hilbert locality, research 04 #30). A flamegraph
// without rectangles.
import type { JSX } from 'solid-js'
import { createSignal, onMount, splitProps } from 'solid-js'

export interface HilbertTreeNode {
  label: string
  /** Subtree weight (leaf mass); children split the parent's weight. */
  weight: number
  children?: HilbertTreeNode[]
}

export interface HilbertTreeProps {
  root: HilbertTreeNode
  /** Grid order: 2^order × 2^order cells (default 6 → 64×64). */
  order?: number
  /** Cell size in px (default 5). */
  cell?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

/** Hilbert curve: distance along the curve → (x, y) in a 2^order grid. */
function d2xy(d: number, order: number): [number, number] {
  let rx: number
  let ry: number
  let t = d
  let x = 0
  let y = 0
  for (let s = 1; s < 1 << order; s <<= 1) {
    rx = (t >> 1) & 1
    ry = (t ^ rx) & 1
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x
        y = s - 1 - y
      }
      const tmp = x
      x = y
      y = tmp
    }
    x += s * rx
    y += s * ry
    t >>= 2
  }
  return [x, y]
}

export function HilbertTree(props: HilbertTreeProps) {
  const [own, rest] = splitProps(props, [
    'root',
    'order',
    'cell',
    'label',
    'class',
    'className',
    'style',
  ])

  const order = () => own.order ?? 6
  const cell = () => own.cell ?? 5
  const grid = () => 1 << order()
  const dim = () => grid() * cell()
  const totalCells = () => grid() * grid()

  const [hover, setHover] = createSignal<string | null>(null)
  const cells = new Map<string, { path: string; depth: number }>()
  let canvas!: HTMLCanvasElement

  // depth-first: each node paints its span at its own depth/color, then
  // children overpaint their proportional sub-spans
  const paintNode = (
    node: HilbertTreeNode,
    start: number,
    end: number,
    depth: number,
    path: string,
    ctx: CanvasRenderingContext2D,
  ) => {
    const hue = (((path.charCodeAt(path.length - 1) * 37) % 360) + 360) % 360
    ctx.fillStyle = `oklch(${(0.38 + depth * 0.06).toFixed(2)} 0.08 ${hue.toFixed(0)})`
    for (let d = start; d < end; d++) {
      const [x, y] = d2xy(d, order())
      ctx.fillRect(x * cell(), y * cell(), cell() - 0.5, cell() - 0.5)
      cells.set(`${x},${y}`, { path, depth })
    }
    if (node.children && node.children.length > 0) {
      const total = node.children.reduce((a, c) => a + c.weight, 0)
      let pos = start
      for (const child of node.children) {
        const span = Math.round(((end - start) * child.weight) / total)
        if (span <= 0) continue
        paintNode(child, pos, Math.min(end, pos + span), depth + 1, `${path}/${child.label}`, ctx)
        pos += span
      }
    }
  }

  onMount(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'oklch(0.16 0.01 250)'
    ctx.fillRect(0, 0, dim(), dim())
    paintNode(props.root, 0, totalCells(), 0, props.root.label, ctx)
  })

  const onHover = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const gx = Math.floor(((event.clientX - rect.left) / rect.width) * grid())
    const gy = Math.floor(((event.clientY - rect.top) / rect.height) * grid())
    const hit = cells.get(`${gx},${gy}`)
    setHover(hit ? hit.path : null)
  }

  return (
    <figure
      {...rest}
      class={`inline-block ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <canvas
        ref={canvas}
        width={dim()}
        height={dim()}
        class="rounded-lg"
        style={{ width: `${dim()}px`, height: `${dim()}px` }}
        onPointerMove={onHover}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${own.label ?? 'Hilbert tree'} — weighted tree laid out on a Hilbert curve`}
      />
      <figcaption class="mt-1.5 text-xs text-gray-400">
        <span class="font-mono text-[10px] text-gray-500" aria-live="polite">
          {hover() ?? own.label ?? `order ${order()} · ${grid()}×${grid()} cells · hover for paths`}
        </span>
      </figcaption>
    </figure>
  )
}

export default HilbertTree
