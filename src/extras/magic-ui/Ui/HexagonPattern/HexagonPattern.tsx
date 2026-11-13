// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/hexagon-pattern.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import { createMemo, createUniqueId, splitProps, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

/**
 * HexagonPattern Component Props
 *
 * @param {number} [radius=40] - The radius of each hexagon (center to vertex)
 * @param {number} [gap=0] - Spacing in pixels between adjacent hexagons
 * @param {number} [x=-1] - Offset applied to the pattern origin on the x-axis
 * @param {number} [y=-1] - Offset applied to the pattern origin on the y-axis
 * @param {'horizontal' | 'vertical'} [direction='horizontal'] - Orientation of the hexagons
 * @param {string} [strokeDasharray='0'] - SVG stroke-dasharray applied to each hexagon outline
 * @param {Array<[number, number]>} [hexagons] - [col, row] coordinates of hexagons to highlight (fill)
 * @param {string} [className] - Additional CSS classes to apply to the SVG container
 */
// PORT-NOTE: `direction` is omitted from the SVG base (it is a real SVG/CSS
// attribute) so the component's horizontal/vertical prop can use that name.
interface HexagonPatternProps extends Omit<JSX.SvgSVGAttributes<SVGSVGElement>, 'direction'> {
  radius?: number
  gap?: number
  x?: number
  y?: number
  direction?: 'horizontal' | 'vertical'
  strokeDasharray?: string
  hexagons?: Array<[col: number, row: number]>
  className?: string
}

type HexPoint = readonly [number, number]

function hexVertexList(
  cx: number,
  cy: number,
  r: number,
  direction: 'horizontal' | 'vertical',
): HexPoint[] {
  const startAngle = direction === 'horizontal' ? 0 : 30
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((startAngle + i * 60) * Math.PI) / 180
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const
  })
}

function hexPoints(
  cx: number,
  cy: number,
  r: number,
  direction: 'horizontal' | 'vertical',
): string {
  return hexVertexList(cx, cy, r, direction)
    .map(([px, py]) => `${px},${py}`)
    .join(' ')
}

function edgeLexKey(a: HexPoint, b: HexPoint): string {
  const [p, q] = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? [a, b] : [b, a]
  return `${p[0].toFixed(6)},${p[1].toFixed(6)}|${q[0].toFixed(6)},${q[1].toFixed(6)}`
}

function collectUniqueHexEdges(
  centers: [number, number][],
  r: number,
  direction: 'horizontal' | 'vertical',
): [HexPoint, HexPoint][] {
  const seen = new Set<string>()
  const edges: [HexPoint, HexPoint][] = []
  for (const [cx, cy] of centers) {
    const verts = hexVertexList(cx, cy, r, direction)
    for (let i = 0; i < 6; i++) {
      const a = verts[i]
      const b = verts[(i + 1) % 6]
      const key = edgeLexKey(a, b)
      if (!seen.has(key)) {
        seen.add(key)
        edges.push([a, b])
      }
    }
  }
  return edges
}

function isSolidStrokeDasharray(strokeDasharray: string): boolean {
  const t = strokeDasharray.trim()
  return t === '' || t === 'none' || t === '0'
}

function getHexSpacing(
  r: number,
  direction: 'horizontal' | 'vertical',
  gap: number,
): {
  colStep: number
  rowStep: number
  tileW: number
  tileH: number
} {
  const sqrt3 = Math.sqrt(3)

  // `gap` should match the visible edge-to-edge spacing, so we add it along
  // the shared-edge normal instead of directly on the raw x/y axes.
  if (direction === 'horizontal') {
    const colStep = (3 * r) / 2 + (sqrt3 * gap) / 2
    const rowStep = sqrt3 * r + gap

    return {
      colStep,
      rowStep,
      tileW: colStep * 2,
      tileH: rowStep,
    }
  }

  const colStep = sqrt3 * r + gap
  const rowStep = (3 * r) / 2 + (sqrt3 * gap) / 2

  return {
    colStep,
    rowStep,
    tileW: colStep,
    tileH: rowStep * 2,
  }
}

function getTileGeometry(
  r: number,
  direction: 'horizontal' | 'vertical',
  gap: number,
): {
  tileW: number
  tileH: number
  centers: [number, number][]
} {
  if (direction === 'horizontal') {
    const { colStep, rowStep, tileW, tileH } = getHexSpacing(r, direction, gap)

    const canonical: [number, number][] = [
      [colStep / 2, rowStep / 2],
      [(colStep * 3) / 2, rowStep],
    ]

    const centers: [number, number][] = []
    for (const [cx, cy] of canonical) {
      centers.push([cx, cy])
      if (cy - r < 0) centers.push([cx, cy + tileH])
      if (cy + r > tileH) centers.push([cx, cy - tileH])
      if (cx - r < 0) centers.push([cx + tileW, cy])
      if (cx + r > tileW) centers.push([cx - tileW, cy])
      if (cy - r < 0 && cx - r < 0) centers.push([cx + tileW, cy + tileH])
      if (cy - r < 0 && cx + r > tileW) centers.push([cx - tileW, cy + tileH])
      if (cy + r > tileH && cx - r < 0) centers.push([cx + tileW, cy - tileH])
      if (cy + r > tileH && cx + r > tileW) centers.push([cx - tileW, cy - tileH])
    }

    return { tileW, tileH, centers }
  } else {
    const { colStep, rowStep, tileW, tileH } = getHexSpacing(r, direction, gap)

    const canonical: [number, number][] = [
      [colStep / 2, rowStep / 2],
      [colStep, (rowStep * 3) / 2],
    ]

    const centers: [number, number][] = []
    for (const [cx, cy] of canonical) {
      centers.push([cx, cy])
      if (cy - r < 0) centers.push([cx, cy + tileH])
      if (cy + r > tileH) centers.push([cx, cy - tileH])
      if (cx - r < 0) centers.push([cx + tileW, cy])
      if (cx + r > tileW) centers.push([cx - tileW, cy])
      if (cy - r < 0 && cx - r < 0) centers.push([cx + tileW, cy + tileH])
      if (cy - r < 0 && cx + r > tileW) centers.push([cx - tileW, cy + tileH])
      if (cy + r > tileH && cx - r < 0) centers.push([cx + tileW, cy - tileH])
      if (cy + r > tileH && cx + r > tileW) centers.push([cx - tileW, cy - tileH])
    }

    return { tileW, tileH, centers }
  }
}

function hexCenter(
  col: number,
  row: number,
  r: number,
  direction: 'horizontal' | 'vertical',
  gap: number,
): [number, number] {
  if (direction === 'horizontal') {
    const { colStep, rowStep } = getHexSpacing(r, direction, gap)
    const x = col * colStep + colStep / 2
    const y = row * rowStep + rowStep / 2 + (col % 2 !== 0 ? rowStep / 2 : 0)
    return [x, y]
  } else {
    const { colStep, rowStep } = getHexSpacing(r, direction, gap)
    const x = col * colStep + colStep / 2 + (row % 2 !== 0 ? colStep / 2 : 0)
    const y = row * rowStep + rowStep / 2
    return [x, y]
  }
}

/**
 * Hexagon Pattern Component
 *
 * A hexagon (honeycomb) pattern background rendered as an SVG `<pattern>`.
 * Supports gap spacing, horizontal/vertical orientation, dashed outlines and
 * per-coordinate highlighted hexagons.
 *
 * PORT-NOTE: upstream extends React.SVGProps with `[key: string]: unknown`
 * (a React spread-typing crutch); the Solid port spreads via `splitProps`
 * and needs no index signature.
 */
export function HexagonPattern(props: HexagonPatternProps) {
  const [own, rest] = splitProps(props, [
    'radius',
    'gap',
    'x',
    'y',
    'direction',
    'strokeDasharray',
    'hexagons',
    'class',
    'className',
  ])

  const radius = () => own.radius ?? 40
  const gap = () => own.gap ?? 0
  const x = () => own.x ?? -1
  const y = () => own.y ?? -1
  const direction = () => own.direction ?? 'horizontal'
  const strokeDasharray = () => own.strokeDasharray ?? '0'
  const hexagons = () => own.hexagons ?? []

  const id = createUniqueId()

  // Upstream computes these per render from destructured props.
  const geometry = createMemo(() => getTileGeometry(radius(), direction(), gap()))
  const solidStroke = createMemo(() => isSolidStrokeDasharray(strokeDasharray()))
  const dashedEdges = createMemo(() =>
    solidStroke() ? null : collectUniqueHexEdges(geometry().centers, radius(), direction()),
  )

  return (
    <svg
      aria-hidden="true"
      class={`pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30 ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    >
      <defs>
        <pattern
          id={id}
          width={geometry().tileW}
          height={geometry().tileH}
          patternUnits="userSpaceOnUse"
          x={x()}
          y={y()}
        >
          <Show
            when={solidStroke()}
            fallback={
              <For each={dashedEdges()}>
                {([a, b]) => (
                  <line
                    class="fill-none"
                    x1={a[0]}
                    x2={b[0]}
                    y1={a[1]}
                    y2={b[1]}
                    stroke-dasharray={strokeDasharray()}
                  />
                )}
              </For>
            }
          >
            <For each={geometry().centers}>
              {([cx, cy]) => (
                <polygon
                  class="fill-none"
                  points={hexPoints(cx, cy, radius(), direction())}
                  stroke-dasharray={strokeDasharray()}
                />
              )}
            </For>
          </Show>
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill={`url(#${id})`} stroke="none" />

      <Show when={hexagons().length > 0}>
        <svg aria-hidden="true" class="overflow-visible" x={x()} y={y()}>
          <For each={hexagons()}>
            {([col, row]) => {
              const [cx, cy] = hexCenter(col, row, radius(), direction(), gap())
              return (
                <polygon points={hexPoints(cx, cy, radius() - 1, direction())} stroke-width="0" />
              )
            }}
          </For>
        </svg>
      </Show>
    </svg>
  )
}

export default HexagonPattern
