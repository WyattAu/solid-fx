// Source: github.com/codse/animata animata/preloader/vertical-tiles.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream's framer-motion <motion.div> tiles + useInView are
// translated to vanilla motion animate() driven from an IntersectionObserver
// (once: true, amount: 0.3 → threshold 0.3, disconnecting after the first
// intersection). Re-tiles on resize like upstream, re-running the slide so the
// cover is rebuilt with the new tile widths. Upstream merges classes with cn()
// (clsx + tailwind-merge); this port template-joins, equivalent for the plain
// strings passed here.

import { animate, type AnimationPlaybackControls } from 'motion'
import type { JSX } from 'solid-js'
import { createEffect, createSignal, For, onCleanup, onMount } from 'solid-js'

interface Tile {
  id: number
  width: number
  order: number
}

interface VerticalTilesProps {
  /**
   * The class name to apply to each tile.
   */
  tileClassName?: string

  /**
   * The minimum width of a single tile, in pixels.
   */
  minTileWidth?: number

  /**
   * The duration of the slide animation, in seconds.
   */
  animationDuration?: number

  /**
   * The delay before the animation starts, in seconds.
   */
  animationDelay?: number

  /**
   * The stagger between neighbouring tiles, in seconds.
   */
  stagger?: number

  /**
   * The content revealed beneath the tiles.
   */
  children?: JSX.Element
}

export default function VerticalTiles(props: VerticalTilesProps) {
  const [tiles, setTiles] = createSignal<Tile[]>([])
  const [isInView, setIsInView] = createSignal(false)
  let containerEl!: HTMLDivElement
  const tileEls: HTMLDivElement[] = []

  const minTileWidth = () => props.minTileWidth ?? 32
  const animationDuration = () => props.animationDuration ?? 0.5
  const animationDelay = () => props.animationDelay ?? 1
  const stagger = () => props.stagger ?? 0.05

  const calculateTiles = () => {
    const { offsetWidth: width } = containerEl
    const tileCount = Math.max(3, Math.floor(width / minTileWidth()))
    const tileWidth = width / tileCount + 1

    setTiles(
      Array.from({ length: tileCount }, (_, index) => ({
        id: index,
        width: tileWidth,
        order: Math.abs(index - Math.floor((tileCount - 1) / 2)),
      })),
    )
  }

  onMount(() => {
    calculateTiles()
    const resizeObserver = new ResizeObserver(calculateTiles)
    resizeObserver.observe(containerEl)
    onCleanup(() => resizeObserver.disconnect())

    const viewObserver = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setIsInView(true)
          viewObserver.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    viewObserver.observe(containerEl)
    onCleanup(() => viewObserver.disconnect())
  })

  // React: motion.div animate={isInView ? { y: '100%' } : { y: 0 }} — tiles sit
  // still until the container enters the view, then slide down (re-run when a
  // resize rebuilds the tile set, matching upstream's remounted motion.divs).
  createEffect(() => {
    if (!isInView()) return
    const currentTiles = tiles()
    if (currentTiles.length === 0) return

    const controls: AnimationPlaybackControls[] = []
    currentTiles.forEach((tile, index) => {
      const el = tileEls[index]
      if (!el) return
      controls.push(
        animate(
          el,
          { y: '100%' },
          {
            duration: animationDuration(),
            delay: animationDelay() + tile.order * stagger(),
            ease: [0.45, 0, 0.55, 1],
          },
        ),
      )
    })
    onCleanup(() => controls.forEach(control => control.stop()))
  })

  return (
    <div ref={containerEl} class="relative overflow-hidden">
      {props.children}

      <div class="absolute inset-0 flex">
        <For each={tiles()}>
          {(tile, index) => (
            <div
              ref={el => {
                tileEls[index()] = el
              }}
              class={`bg-gray-800 ${props.tileClassName ?? ''}`}
              style={{
                width: `${tile.width}px`,
                position: 'absolute',
                left: `${(tile.id * 100) / tiles().length}%`,
                top: '0',
                height: '100%',
              }}
            />
          )}
        </For>
      </div>
    </div>
  )
}
