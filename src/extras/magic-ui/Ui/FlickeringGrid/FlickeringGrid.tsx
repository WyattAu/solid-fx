// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/flickering-grid.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js'
import type { JSX } from 'solid-js'

interface FlickeringGridProps extends JSX.HTMLAttributes<HTMLDivElement> {
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  width?: number
  height?: number
  /**
   * React parity alias; merges with `class`.
   */
  className?: string
  maxOpacity?: number
}

export const FlickeringGrid = (props: FlickeringGridProps) => {
  const [own, rest] = splitProps(props, [
    'squareSize',
    'gridGap',
    'flickerChance',
    'color',
    'width',
    'height',
    'class',
    'className',
    'maxOpacity',
  ])

  const squareSize = () => own.squareSize ?? 4
  const gridGap = () => own.gridGap ?? 6
  const flickerChance = () => own.flickerChance ?? 0.3
  const color = () => own.color ?? 'rgb(0, 0, 0)'
  const maxOpacity = () => own.maxOpacity ?? 0.3
  const width = () => own.width
  const height = () => own.height

  let canvasRef!: HTMLCanvasElement
  let containerRef!: HTMLDivElement

  const [isInView, setIsInView] = createSignal(false)
  const [canvasSize, setCanvasSize] = createSignal({ width: 0, height: 0 })

  // Upstream: useMemo on [color] — resolve any CSS color string to an
  // open-ended "rgba(r, g, b," prefix the draw loop appends opacity to.
  const memoizedColor = createMemo(() => {
    const toRGBA = (color: string) => {
      if (typeof window === 'undefined') {
        return 'rgba(0, 0, 0,'
      }
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'rgba(255, 0, 0,'
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
      return `rgba(${r}, ${g}, ${b},`
    }
    return toRGBA(color())
  })

  const setupCanvas = (canvas: HTMLCanvasElement, width: number, height: number) => {
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const cols = Math.ceil(width / (squareSize() + gridGap()))
    const rows = Math.ceil(height / (squareSize() + gridGap()))

    const squares = new Float32Array(cols * rows)
    for (let i = 0; i < squares.length; i++) {
      squares[i] = Math.random() * maxOpacity()
    }

    return { cols, rows, squares, dpr }
  }

  const updateSquares = (squares: Float32Array, deltaTime: number) => {
    for (let i = 0; i < squares.length; i++) {
      if (Math.random() < flickerChance() * deltaTime) {
        squares[i] = Math.random() * maxOpacity()
      }
    }
  }

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cols: number,
    rows: number,
    squares: Float32Array,
    dpr: number,
  ) => {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const opacity = squares[i * rows + j]
        ctx.fillStyle = `${memoizedColor()}${opacity})`
        ctx.fillRect(
          i * (squareSize() + gridGap()) * dpr,
          j * (squareSize() + gridGap()) * dpr,
          squareSize() * dpr,
          squareSize() * dpr,
        )
      }
    }
  }

  // Upstream: useEffect on [setupCanvas, updateSquares, drawGrid, width,
  // height, isInView] — sizes the canvas, wires observers, and (re)starts the
  // rAF loop when isInView flips. Solid: one-time setup in onMount, prop
  // values read at call time through accessors, and a small effect that
  // tracks isInView() for the loop restart.
  onMount(() => {
    const canvas = canvasRef
    const container = containerRef
    const ctx = canvas.getContext('2d') ?? null
    let animationFrameId: number | null = null
    let gridParams: ReturnType<typeof setupCanvas> | null = null

    if (canvas && container && ctx) {
      const updateCanvasSize = () => {
        const newWidth = width() || container.clientWidth
        const newHeight = height() || container.clientHeight
        setCanvasSize({ width: newWidth, height: newHeight })
        gridParams = setupCanvas(canvas, newWidth, newHeight)
      }

      updateCanvasSize()

      let lastTime = 0
      const animate = (time: number) => {
        // Upstream stops scheduling (loop dies) when scrolled out of view;
        // the isInView effect below restarts it when it comes back.
        if (!isInView() || !gridParams) return

        const deltaTime = (time - lastTime) / 1000
        lastTime = time

        updateSquares(gridParams.squares, deltaTime)
        drawGrid(
          ctx,
          canvas.width,
          canvas.height,
          gridParams.cols,
          gridParams.rows,
          gridParams.squares,
          gridParams.dpr,
        )
        animationFrameId = requestAnimationFrame(animate)
      }

      const resizeObserver = new ResizeObserver(() => {
        updateCanvasSize()
      })
      resizeObserver.observe(container)

      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting)
        },
        { threshold: 0 },
      )
      intersectionObserver.observe(canvas)

      // Upstream re-runs its whole effect (resetting lastTime and restarting
      // the rAF loop) when isInView changes; this tracked read mirrors that.
      createEffect(() => {
        lastTime = 0
        if (isInView()) {
          animationFrameId = requestAnimationFrame(animate)
        }
        onCleanup(() => {
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId)
            animationFrameId = null
          }
        })
      })

      onCleanup(() => {
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
      })
    }
  })

  return (
    <div
      ref={containerRef}
      {...rest}
      class={`h-full w-full ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <canvas
        ref={canvasRef}
        class="pointer-events-none"
        // PORT-NOTE: React appended "px" to numeric style values; Solid needs
        // the unit spelled out.
        style={{
          width: `${canvasSize().width}px`,
          height: `${canvasSize().height}px`,
        }}
      />
    </div>
  )
}

export default FlickeringGrid
