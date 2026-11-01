import { createEffect, createMemo, createSignal, For, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'

export interface DriftWallItem {
  image: string
  title?: string
  href?: string
}

export interface DriftWallProps {
  items?: DriftWallItem[]
  columns?: number
  tileWidth?: number
  tileHeight?: number
  gap?: number
  radius?: number
  tilt?: number
  turn?: number
  roll?: number
  perspective?: number
  depth?: number
  speed?: number
  direction?: 'up' | 'down'
  variance?: number
  parallax?: number
  pauseOnHover?: boolean
  lift?: number
  fade?: number
  dim?: number
  grayscale?: boolean
  overlayColor?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface ColumnMeta {
  copyHeight: number
  copies: number
}

const DEFAULT_ITEMS: DriftWallItem[] = Array.from({ length: 15 }, (_, i) => {
  const ids = [1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110, 133, 164]
  return {
    image: `https://picsum.photos/id/${ids[i % ids.length]}/600/400`,
    title: `Tile ${i + 1}`,
    href: undefined,
  }
})

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const columnFactor = (index: number, variance: number): number => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1
  return 1 + variance * pseudo
}

const DriftWall = (props: DriftWallProps) => {
  let containerRef!: HTMLDivElement
  let planeRef!: HTMLDivElement
  const tracks: (HTMLDivElement | undefined)[] = []
  let raf = 0
  let lastTs: number | null = null

  let offsets: number[] = []
  let velocities: number[] = []
  let hoveredCol = -1
  let wallHovered = false
  const pointer = { x: 0, y: 0 }
  const pointerDamped = { x: 0, y: 0 }

  const [containerHeight, setContainerHeight] = createSignal(600)
  const [activeId, setActiveId] = createSignal<string | null>(null)
  let activeIdCurrent: string | null = null
  const [reduced, setReduced] = createSignal(false)

  onMount(() => {
    setReduced(prefersReducedMotion())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    onCleanup(() => mq.removeEventListener('change', onChange))
  })

  const columnItems = createMemo<DriftWallItem[][]>(() => {
    const items = props.items ?? DEFAULT_ITEMS
    const columns = props.columns ?? 5
    const cols: DriftWallItem[][] = Array.from({ length: columns }, () => [])
    items.forEach((item, i) => cols[i % columns].push(item))
    return cols.map(col => (col.length ? col : items.slice(0, 1)))
  })

  const columnMeta = createMemo<ColumnMeta[]>(() => {
    const unit = (props.tileHeight ?? 132) + (props.gap ?? 18)
    return columnItems().map(col => {
      const copyHeight = Math.max(unit, col.length * unit)
      const copies = Math.max(2, Math.ceil((containerHeight() * 1.6) / copyHeight) + 1)
      return { copyHeight, copies }
    })
  })

  onMount(() => {
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height || 600)
    })
    ro.observe(containerRef)
    onCleanup(() => ro.disconnect())
  })

  const baseVelocities = createMemo<number[]>(() => {
    const dirSign = (props.direction ?? 'up') === 'up' ? 1 : -1
    return columnItems().map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1
      return (props.speed ?? 42) * columnFactor(c, props.variance ?? 0.45) * dirSign * altSign
    })
  })

  createEffect(() => {
    offsets = columnMeta().map((meta, c) => meta.copyHeight * ((c * 0.37) % 1))
    velocities = columnItems().map(() => 0)
  })

  const applyPlaneTransform = (px: number, py: number) => {
    const plane = planeRef
    if (!plane) return
    plane.style.transform =
      `translate(-50%, -50%) scale(1.18) ` +
      `rotateX(${(props.tilt ?? 16) + py}deg) rotateY(${(props.turn ?? -14) + px}deg) rotateZ(${props.roll ?? 0}deg) ` +
      `translateZ(${-(props.depth ?? 120)}px)`
  }

  // Engine — re-runs on the same set upstream re-initialized on
  // [baseVelocities, columnMeta, pauseOnHover, parallax, reduced].
  createEffect(() => {
    const base = baseVelocities()
    const meta = columnMeta()
    const pauseOnHover = props.pauseOnHover ?? false
    const parallax = props.parallax ?? 0.6
    const isReduced = reduced()
    void base
    void meta

    const animate = (ts: number) => {
      if (lastTs === null) lastTs = ts
      const dt = Math.min(0.05, Math.max(0, ts - lastTs) / 1000)
      lastTs = ts

      const maxTilt = parallax * 8
      const targetX = pointer.x * maxTilt
      const targetY = -pointer.y * maxTilt
      const damp = 1 - Math.exp(-dt / 0.12)
      pointerDamped.x += (targetX - pointerDamped.x) * damp
      pointerDamped.y += (targetY - pointerDamped.y) * damp
      applyPlaneTransform(pointerDamped.x, pointerDamped.y)

      if (!isReduced) {
        for (let c = 0; c < tracks.length; c++) {
          const m = columnMeta()[c]
          if (!m) continue
          const paused = wallHovered && pauseOnHover
          const factor = paused || hoveredCol === c ? 0 : 1
          const target = baseVelocities()[c] * factor

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28))
          velocities[c] += (target - velocities[c]) * ease
          let next = (offsets[c] ?? 0) + velocities[c] * dt
          next = ((next % m.copyHeight) + m.copyHeight) % m.copyHeight
          offsets[c] = next

          const el = tracks[c]
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`
        }
      } else {
        for (let c = 0; c < tracks.length; c++) {
          const el = tracks[c]
          const m = columnMeta()[c]
          if (el && m) el.style.transform = `translate3d(0, ${-(offsets[c] ?? 0)}px, 0)`
        }
      }

      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    onCleanup(() => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      lastTs = null
    })
  })

  const activate = (id: string, index: number): void => {
    activeIdCurrent = id
    hoveredCol = index
    setActiveId(id)
  }
  const release = (): void => {
    activeIdCurrent = null
    hoveredCol = -1
    setActiveId(null)
  }

  const handlePointerMove = (e: PointerEvent) => {
    const rect = containerRef.getBoundingClientRect()
    if (!rect) return
    if ((props.parallax ?? 0.6) > 0 && !reduced()) {
      pointer.x = (e.clientX - rect.left) / rect.width - 0.5
      pointer.y = (e.clientY - rect.top) / rect.height - 0.5
    }
    const hit = document.elementFromPoint(e.clientX, e.clientY)
    const tile = hit?.closest ? (hit.closest('[data-tile-id]') as HTMLElement | null) : null
    if (!tile) return
    const id = tile.dataset.tileId ?? null
    if (id === activeIdCurrent) return
    activeIdCurrent = id
    hoveredCol = Number(tile.dataset.col)
    setActiveId(id)
  }

  const handlePointerLeaveWall = (): void => {
    wallHovered = false
    pointer.x = 0
    pointer.y = 0
    release()
  }

  const maskStyle =
    'radial-gradient(ellipse 78% 82% at 50% 46%, #000 var(--dw-edge), transparent 100%), ' +
    'linear-gradient(to top, #000 var(--dw-edge), transparent 100%)'

  const cssVars = createMemo<JSX.CSSProperties>(
    () =>
      ({
        '--dw-tile-w': `${props.tileWidth ?? 200}px`,
        '--dw-tile-h': `${props.tileHeight ?? 132}px`,
        '--dw-gap': `${props.gap ?? 18}px`,
        '--dw-radius': `${props.radius ?? 14}px`,
        '--dw-lift': `${props.lift ?? 64}px`,
        '--dw-dim': props.dim ?? 0.55,
        '--dw-gray': (props.grayscale ?? false) ? 1 : 0,
        '--dw-overlay': props.overlayColor ?? '#060010',
        '--dw-edge': `${Math.max(0, (1 - (props.fade ?? 0.6)) * 100)}%`,
        perspective: `${props.perspective ?? 1200}px`,
        'perspective-origin': '50% 50%',
        '-webkit-mask-image': maskStyle,
        'mask-image': maskStyle,
        '-webkit-mask-composite': 'source-in',
        'mask-composite': 'intersect',
        ...props.style,
      }) as JSX.CSSProperties,
  )

  const tileClass = cx(
    'group/tile relative block flex-none cursor-pointer outline-none',
    'h-[calc(var(--dw-tile-h)+var(--dw-gap))] w-full [transform-style:preserve-3d]',
  )
  const innerClass = cx(
    'pointer-events-none absolute inset-[calc(var(--dw-gap)/2)] block overflow-hidden bg-[#0b0b12]',
    'rounded-[var(--dw-radius)] opacity-[var(--dw-dim)] [transform:translateZ(0)]',
    'transition-[transform,opacity,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:opacity-100 group-[.is-active]/tile:[transform:translateZ(var(--dw-lift))]',
    'group-[.is-active]/tile:shadow-[0_24px_60px_-18px_rgba(0,0,0,0.7)]',
    'group-focus-visible/tile:opacity-100 group-focus-visible/tile:[transform:translateZ(var(--dw-lift))]',
    'group-focus-visible/tile:shadow-[0_24px_60px_-18px_rgba(0,0,0,0.7),0_0_0_2px_rgba(255,255,255,0.9)]',
  )
  const imgClass = cx(
    'block h-full w-full select-none object-cover',
    '[filter:grayscale(var(--dw-gray))_saturate(0.92)]',
    'transition-[filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:[filter:grayscale(0)_saturate(1.05)] group-focus-visible/tile:[filter:grayscale(0)_saturate(1.05)]',
  )
  const overlayClass = cx(
    'pointer-events-none absolute inset-0 bg-[var(--dw-overlay)] opacity-[0.42]',
    'transition-opacity duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:opacity-0 group-focus-visible/tile:opacity-0',
  )

  const renderTile = (item: DriftWallItem, id: string, colIndex: number) => {
    const inner = (
      <span class={innerClass}>
        <img
          src={item.image}
          alt={item.title ?? ''}
          loading="lazy"
          decoding="async"
          draggable={false}
          class={imgClass}
        />
        <span class={overlayClass} aria-hidden="true" />
      </span>
    )
    const isActive = activeId() === id
    if (item.href) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer noopener"
          class={cx(tileClass, isActive && 'is-active')}
          data-tile-id={id}
          data-col={colIndex}
          onFocus={() => activate(id, colIndex)}
          onBlur={release}
        >
          {inner}
        </a>
      )
    }
    return (
      <div
        tabIndex={0}
        role="button"
        aria-label={item.title ?? 'tile'}
        class={cx(tileClass, isActive && 'is-active')}
        data-tile-id={id}
        data-col={colIndex}
        onFocus={() => activate(id, colIndex)}
        onBlur={release}
      >
        {inner}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      class={cx('relative h-full w-full overflow-hidden', props.class, props.className)}
      style={cssVars()}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        wallHovered = true
      }}
      onPointerLeave={handlePointerLeaveWall}
      role="group"
      aria-label="Drifting wall of tiles"
    >
      <div
        ref={planeRef}
        class="absolute top-1/2 left-1/2 flex cursor-pointer flex-row [transform-style:preserve-3d] [transform-origin:50%_50%] will-change-transform"
      >
        <For each={columnItems()}>
          {(col, c) => {
            const m = columnMeta()[c()]
            const copies = Array.from({ length: m?.copies ?? 2 })
            return (
              <div class="relative w-[calc(var(--dw-tile-w)+var(--dw-gap))] [transform-style:preserve-3d]">
                <div
                  class="flex flex-col [transform-style:preserve-3d] will-change-transform"
                  ref={el => {
                    tracks[c()] = el
                  }}
                >
                  {copies.map((_, copyIndex) =>
                    col.map((item, itemIndex) =>
                      renderTile(item, `${c()}-${copyIndex}-${itemIndex}`, c()),
                    ),
                  )}
                </div>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default DriftWall
