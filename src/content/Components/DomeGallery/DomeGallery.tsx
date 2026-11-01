import { createEffect, createMemo, onCleanup, onMount } from 'solid-js'
import { For } from 'solid-js'
import type { JSX } from 'solid-js'
import { Gesture } from '@use-gesture/vanilla'

export type DomeGalleryItem = string | { src: string; alt?: string }

export interface DomeGalleryProps {
  images?: DomeGalleryItem[]
  fit?: number
  fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height'
  minRadius?: number
  maxRadius?: number
  padFactor?: number
  overlayBlurColor?: string
  maxVerticalRotationDeg?: number
  dragSensitivity?: number
  enlargeTransitionMs?: number
  segments?: number
  dragDampening?: number
  openedImageWidth?: string
  openedImageHeight?: string
  imageBorderRadius?: string
  openedImageBorderRadius?: string
  grayscale?: boolean
}

type ItemDef = {
  src: string
  alt: string
  x: number
  y: number
  sizeX: number
  sizeY: number
}

const DEFAULT_IMAGES: DomeGalleryItem[] = [
  {
    src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Abstract art',
  },
  {
    src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Modern sculpture',
  },
  {
    src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Digital artwork',
  },
  {
    src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Contemporary art',
  },
  {
    src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Geometric pattern',
  },
  {
    src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Textured surface',
  },
  {
    src: 'https://pbs.twimg.com/media/Gyla7NnXMAAXSo_?format=jpg&name=large',
    alt: 'Social media image',
  },
]

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35,
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360
  return a - 180
}
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`)
  const n = attr == null ? NaN : parseFloat(attr)
  return Number.isFinite(n) ? n : fallback
}

function buildItems(pool: DomeGalleryItem[], seg: number): ItemDef[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2)
  const evenYs = [-4, -2, 0, 2, 4]
  const oddYs = [-3, -1, 1, 3, 5]

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }))
  })

  const totalSlots = coords.length
  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }))
  }
  if (pool.length > totalSlots) {
    console.warn(
      `[DomeGallery] Provided image count (${pool.length}) exceeds available tiles (${totalSlots}). Some images will not be shown.`,
    )
  }

  const normalizedImages = pool.map(image => {
    if (typeof image === 'string') {
      return { src: image, alt: '' }
    }
    return { src: image.src || '', alt: image.alt || '' }
  })

  const usedImages = Array.from(
    { length: totalSlots },
    (_, i) => normalizedImages[i % normalizedImages.length],
  )

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i]
          usedImages[i] = usedImages[j]
          usedImages[j] = tmp
          break
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
  }))
}

function computeItemBaseRotation(
  offsetX: number,
  offsetY: number,
  sizeX: number,
  sizeY: number,
  segments: number,
) {
  const unit = 360 / segments / 2
  const rotateY = unit * (offsetX + (sizeX - 1) / 2)
  const rotateX = unit * (offsetY - (sizeY - 1) / 2)
  return { rotateX, rotateY }
}

export default function DomeGallery(props: DomeGalleryProps) {
  let root!: HTMLDivElement
  let main!: HTMLDivElement
  let sphere!: HTMLDivElement
  let frame!: HTMLDivElement
  let viewer!: HTMLDivElement
  let scrim!: HTMLDivElement
  let focusedEl: HTMLElement | null = null
  let originalTilePosition: { left: number; top: number; width: number; height: number } | null =
    null

  let rotation = { x: 0, y: 0 }
  let startRot = { x: 0, y: 0 }
  let startPos: { x: number; y: number } | null = null
  let dragging = false
  let cancelTap = false
  let moved = false
  let inertiaRAF: number | null = null
  let pointerType: 'mouse' | 'pen' | 'touch' = 'mouse'
  let tapTarget: HTMLElement | null = null
  let opening = false
  let openStartedAt = 0
  let lastDragEndAt = 0

  let scrollLocked = false
  const lockScroll = () => {
    if (scrollLocked) return
    scrollLocked = true
    document.body.classList.add('dg-scroll-lock')
  }
  const unlockScroll = () => {
    if (!scrollLocked) return
    if (root?.getAttribute('data-enlarging') === 'true') return
    scrollLocked = false
    document.body.classList.remove('dg-scroll-lock')
  }

  const images = () => (props.images?.length ? props.images : DEFAULT_IMAGES)
  const items = createMemo(() => buildItems(images(), props.segments ?? DEFAULTS.segments))

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphere
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`
    }
  }

  let lockedRadius: number | null = null

  onMount(() => {
    applyTransform(rotation.x, rotation.y)
  })

  // Upstream: effect on [fit, fitBasis, minRadius, maxRadius, padFactor,
  // overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius,
  // openedImageWidth, openedImageHeight] — radius + overlay measurement.
  createEffect(() => {
    const fit = props.fit ?? 0.5
    const fitBasis = props.fitBasis ?? 'auto'
    const minRadius = props.minRadius ?? 600
    const maxRadius = props.maxRadius ?? Infinity
    const padFactor = props.padFactor ?? 0.25
    const overlayBlurColor = props.overlayBlurColor ?? '#120F17'
    const grayscale = props.grayscale ?? true
    const imageBorderRadius = props.imageBorderRadius ?? '30px'
    const openedImageBorderRadius = props.openedImageBorderRadius ?? '30px'
    const openedImageWidth = props.openedImageWidth ?? '400px'
    const openedImageHeight = props.openedImageHeight ?? '400px'

    const rt = root
    if (!rt) return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect
      const w = Math.max(1, cr.width),
        h = Math.max(1, cr.height)
      const minDim = Math.min(w, h),
        maxDim = Math.max(w, h),
        aspect = w / h
      let basis: number
      switch (fitBasis) {
        case 'min':
          basis = minDim
          break
        case 'max':
          basis = maxDim
          break
        case 'width':
          basis = w
          break
        case 'height':
          basis = h
          break
        default:
          basis = aspect >= 1.3 ? w : minDim
      }
      let radius = basis * fit
      const heightGuard = h * 1.35
      radius = Math.min(radius, heightGuard)
      radius = clamp(radius, minRadius, maxRadius)
      lockedRadius = Math.round(radius)

      const viewerPad = Math.max(8, Math.round(minDim * padFactor))
      rt.style.setProperty('--radius', `${lockedRadius}px`)
      rt.style.setProperty('--viewer-pad', `${viewerPad}px`)
      rt.style.setProperty('--overlay-blur-color', overlayBlurColor)
      rt.style.setProperty('--tile-radius', imageBorderRadius)
      rt.style.setProperty('--enlarge-radius', openedImageBorderRadius)
      rt.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none')
      applyTransform(rotation.x, rotation.y)

      const enlargedOverlay = viewer?.querySelector('.enlarge') as HTMLElement | null
      if (enlargedOverlay && frame && main) {
        const frameR = frame.getBoundingClientRect()
        const mainR = main.getBoundingClientRect()

        const hasCustomSize = openedImageWidth && openedImageHeight
        if (hasCustomSize) {
          const tempDiv = document.createElement('div')
          tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`
          document.body.appendChild(tempDiv)
          const tempRect = tempDiv.getBoundingClientRect()
          document.body.removeChild(tempDiv)

          const centeredLeft = frameR.left - mainR.left + (frameR.width - tempRect.width) / 2
          const centeredTop = frameR.top - mainR.top + (frameR.height - tempRect.height) / 2

          enlargedOverlay.style.left = `${centeredLeft}px`
          enlargedOverlay.style.top = `${centeredTop}px`
        } else {
          enlargedOverlay.style.left = `${frameR.left - mainR.left}px`
          enlargedOverlay.style.top = `${frameR.top - mainR.top}px`
          enlargedOverlay.style.width = `${frameR.width}px`
          enlargedOverlay.style.height = `${frameR.height}px`
        }
      }
    })
    ro.observe(rt)
    onCleanup(() => ro.disconnect())
  })

  const stopInertia = () => {
    if (inertiaRAF) {
      cancelAnimationFrame(inertiaRAF)
      inertiaRAF = null
    }
  }

  const startInertia = (vx: number, vy: number) => {
    const MAX_V = 1.4
    let vX = clamp(vx, -MAX_V, MAX_V) * 80
    let vY = clamp(vy, -MAX_V, MAX_V) * 80
    let frames = 0
    const d = clamp(props.dragDampening ?? 2, 0, 1)
    const frictionMul = 0.94 + 0.055 * d
    const stopThreshold = 0.015 - 0.01 * d
    const maxFrames = Math.round(90 + 270 * d)
    const maxVertical = props.maxVerticalRotationDeg ?? DEFAULTS.maxVerticalRotationDeg
    const step = () => {
      vX *= frictionMul
      vY *= frictionMul
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
        inertiaRAF = null
        return
      }
      if (++frames > maxFrames) {
        inertiaRAF = null
        return
      }
      const nextX = clamp(rotation.x - vY / 200, -maxVertical, maxVertical)
      const nextY = wrapAngleSigned(rotation.y + vX / 200)
      rotation = { x: nextX, y: nextY }
      applyTransform(nextX, nextY)
      inertiaRAF = requestAnimationFrame(step)
    }
    stopInertia()
    inertiaRAF = requestAnimationFrame(step)
  }

  const openItemFromElement = (el: HTMLElement) => {
    const enlargeTransitionMs = props.enlargeTransitionMs ?? DEFAULTS.enlargeTransitionMs
    const openedImageBorderRadius = props.openedImageBorderRadius ?? '30px'
    const openedImageWidth = props.openedImageWidth ?? '400px'
    const openedImageHeight = props.openedImageHeight ?? '400px'
    const grayscale = props.grayscale ?? true
    const segments = props.segments ?? DEFAULTS.segments

    if (opening) return
    opening = true
    openStartedAt = performance.now()
    lockScroll()
    const parent = el.parentElement as HTMLElement
    focusedEl = el
    el.setAttribute('data-focused', 'true')
    const offsetX = getDataNumber(parent, 'offsetX', 0)
    const offsetY = getDataNumber(parent, 'offsetY', 0)
    const sizeX = getDataNumber(parent, 'sizeX', 2)
    const sizeY = getDataNumber(parent, 'sizeY', 2)
    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments)
    const parentY = normalizeAngle(parentRot.rotateY)
    const globalY = normalizeAngle(rotation.y)
    let rotY = -(parentY + globalY) % 360
    if (rotY < -180) rotY += 360
    const rotX = -parentRot.rotateX - rotation.x
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`)
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`)
    const refDiv = document.createElement('div')
    refDiv.className = 'item__image item__image--reference opacity-0'
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`
    parent.appendChild(refDiv)

    void refDiv.offsetHeight

    const tileR = refDiv.getBoundingClientRect()
    const mainR = main?.getBoundingClientRect()
    const frameR = frame?.getBoundingClientRect()

    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      opening = false
      focusedEl = null
      parent.removeChild(refDiv)
      unlockScroll()
      return
    }

    originalTilePosition = {
      left: tileR.left,
      top: tileR.top,
      width: tileR.width,
      height: tileR.height,
    }
    el.style.visibility = 'hidden'
    el.style.zIndex = '0'
    const overlay = document.createElement('div')
    overlay.className = 'enlarge'
    overlay.style.cssText = `position:absolute; left:${frameR.left - mainR.left}px; top:${frameR.top - mainR.top}px; width:${frameR.width}px; height:${frameR.height}px; opacity:0; z-index:30; will-change:transform,opacity; transform-origin:top left; transition:transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease; border-radius:${openedImageBorderRadius}; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.35);`
    const rawSrc =
      parent.dataset.src || (el.querySelector('img') as HTMLImageElement | null)?.src || ''
    const rawAlt =
      parent.dataset.alt || (el.querySelector('img') as HTMLImageElement | null)?.alt || ''
    const img = document.createElement('img')
    img.src = rawSrc
    img.alt = rawAlt
    img.style.cssText = `width:100%; height:100%; object-fit:cover; filter:${grayscale ? 'grayscale(1)' : 'none'};`
    overlay.appendChild(img)
    viewer!.appendChild(overlay)
    const tx0 = tileR.left - frameR.left
    const ty0 = tileR.top - frameR.top
    const sx0 = tileR.width / frameR.width
    const sy0 = tileR.height / frameR.height

    const validSx0 = Number.isFinite(sx0) && sx0 > 0 ? sx0 : 1
    const validSy0 = Number.isFinite(sy0) && sy0 > 0 ? sy0 : 1

    overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`
    setTimeout(() => {
      if (!overlay.parentElement) return
      overlay.style.opacity = '1'
      overlay.style.transform = 'translate(0px, 0px) scale(1, 1)'
      root?.setAttribute('data-enlarging', 'true')
    }, 16)
    const wantsResize = openedImageWidth || openedImageHeight
    if (wantsResize) {
      const onFirstEnd = (ev: TransitionEvent) => {
        if (ev.propertyName !== 'transform') return
        overlay.removeEventListener('transitionend', onFirstEnd)
        const prevTransition = overlay.style.transition
        overlay.style.transition = 'none'
        const tempWidth = openedImageWidth || `${frameR.width}px`
        const tempHeight = openedImageHeight || `${frameR.height}px`
        overlay.style.width = tempWidth
        overlay.style.height = tempHeight
        const newRect = overlay.getBoundingClientRect()
        overlay.style.width = `${frameR.width}px`
        overlay.style.height = `${frameR.height}px`
        void overlay.offsetWidth
        overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`
        const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2
        const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2
        requestAnimationFrame(() => {
          overlay.style.left = `${centeredLeft}px`
          overlay.style.top = `${centeredTop}px`
          overlay.style.width = tempWidth
          overlay.style.height = tempHeight
        })
        const cleanupSecond = () => {
          overlay.removeEventListener('transitionend', cleanupSecond)
          overlay.style.transition = prevTransition
        }
        overlay.addEventListener('transitionend', cleanupSecond, {
          once: true,
        })
      }
      overlay.addEventListener('transitionend', onFirstEnd)
    }
  }

  onMount(() => {
    // Upstream: useGesture({ onDragStart, onDrag }, { target: mainRef, ... }).
    const gesture = new Gesture(
      main,
      {
        onDragStart: ({ event }) => {
          if (focusedEl) return
          stopInertia()

          const evt = event as PointerEvent
          pointerType = (evt.pointerType as 'mouse' | 'pen' | 'touch') || 'mouse'
          if (pointerType === 'touch') evt.preventDefault()
          if (pointerType === 'touch') lockScroll()
          dragging = true
          cancelTap = false
          moved = false
          startRot = { ...rotation }
          startPos = { x: evt.clientX, y: evt.clientY }
          const potential = (evt.target as Element).closest?.('.item__image') as HTMLElement | null
          tapTarget = potential || null
        },
        onDrag: ({
          event,
          last,
          velocity: velArr = [0, 0],
          direction: dirArr = [0, 0],
          movement,
        }) => {
          if (focusedEl || !dragging || !startPos) return

          const evt = event as PointerEvent
          if (pointerType === 'touch') evt.preventDefault()

          const dxTotal = evt.clientX - startPos.x
          const dyTotal = evt.clientY - startPos.y

          if (!moved) {
            const dist2 = dxTotal * dxTotal + dyTotal * dyTotal
            if (dist2 > 16) moved = true
          }

          const maxVertical = props.maxVerticalRotationDeg ?? DEFAULTS.maxVerticalRotationDeg
          const dragSensitivity = props.dragSensitivity ?? DEFAULTS.dragSensitivity
          const nextX = clamp(startRot.x - dyTotal / dragSensitivity, -maxVertical, maxVertical)
          const nextY = startRot.y + dxTotal / dragSensitivity

          if (rotation.x !== nextX || rotation.y !== nextY) {
            rotation = { x: nextX, y: nextY }
            applyTransform(nextX, nextY)
          }

          if (last) {
            dragging = false
            let isTap = false

            if (startPos) {
              const dx = evt.clientX - startPos.x
              const dy = evt.clientY - startPos.y
              const dist2 = dx * dx + dy * dy
              const TAP_THRESH_PX = pointerType === 'touch' ? 10 : 6
              if (dist2 <= TAP_THRESH_PX * TAP_THRESH_PX) {
                isTap = true
              }
            }

            const [vMagX, vMagY] = velArr
            const [dirX, dirY] = dirArr
            let vx = vMagX * dirX
            let vy = vMagY * dirY

            if (!isTap && Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
              const [mx, my] = movement
              vx = (mx / dragSensitivity) * 0.02
              vy = (my / dragSensitivity) * 0.02
            }

            if (!isTap && (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005)) {
              startInertia(vx, vy)
            }
            startPos = null
            cancelTap = !isTap

            if (isTap && tapTarget && !focusedEl) {
              openItemFromElement(tapTarget)
            }
            tapTarget = null

            if (cancelTap) setTimeout(() => (cancelTap = false), 120)
            if (pointerType === 'touch') unlockScroll()
            if (moved) lastDragEndAt = performance.now()
            moved = false
          }
        },
      },
      { eventOptions: { passive: false } },
    )
    onCleanup(() => {
      gesture.destroy()
      stopInertia()
    })
  })

  // Upstream: effect on [enlargeTransitionMs, openedImageBorderRadius, grayscale]
  // — scrim click + Escape closes the enlarged image.
  createEffect(() => {
    const enlargeTransitionMs = props.enlargeTransitionMs ?? DEFAULTS.enlargeTransitionMs
    const openedImageBorderRadius = props.openedImageBorderRadius ?? '30px'
    const grayscale = props.grayscale ?? true

    const sc = scrim
    if (!sc) return

    const close = () => {
      if (performance.now() - openStartedAt < 250) return
      const el = focusedEl
      if (!el) return
      const parent = el.parentElement as HTMLElement
      const overlay = viewer?.querySelector('.enlarge') as HTMLElement | null
      if (!overlay) return

      const refDiv = parent.querySelector('.item__image--reference') as HTMLElement | null

      const originalPos = originalTilePosition
      if (!originalPos) {
        overlay.remove()
        if (refDiv) refDiv.remove()
        parent.style.setProperty('--rot-y-delta', `0deg`)
        parent.style.setProperty('--rot-x-delta', `0deg`)
        el.style.visibility = ''
        el.style.zIndex = '0'
        focusedEl = null
        root?.removeAttribute('data-enlarging')
        opening = false
        return
      }

      const currentRect = overlay.getBoundingClientRect()
      const rootRect = root!.getBoundingClientRect()

      const originalPosRelativeToRoot = {
        left: originalPos.left - rootRect.left,
        top: originalPos.top - rootRect.top,
        width: originalPos.width,
        height: originalPos.height,
      }

      const overlayRelativeToRoot = {
        left: currentRect.left - rootRect.left,
        top: currentRect.top - rootRect.top,
        width: currentRect.width,
        height: currentRect.height,
      }

      const animatingOverlay = document.createElement('div')
      animatingOverlay.className = 'enlarge-closing'
      animatingOverlay.style.cssText = `
        position: absolute;
        left: ${overlayRelativeToRoot.left}px;
        top: ${overlayRelativeToRoot.top}px;
        width: ${overlayRelativeToRoot.width}px;
        height: ${overlayRelativeToRoot.height}px;
        z-index: 9999;
        border-radius: ${openedImageBorderRadius};
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        transition: all ${enlargeTransitionMs}ms ease-out;
        pointer-events: none;
        margin: 0;
        transform: none;
        filter: ${grayscale ? 'grayscale(1)' : 'none'};
      `

      const originalImg = overlay.querySelector('img')
      if (originalImg) {
        const img = originalImg.cloneNode() as HTMLImageElement
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;'
        animatingOverlay.appendChild(img)
      }

      overlay.remove()
      root!.appendChild(animatingOverlay)

      void animatingOverlay.getBoundingClientRect()

      requestAnimationFrame(() => {
        animatingOverlay.style.left = `${originalPosRelativeToRoot.left}px`
        animatingOverlay.style.top = `${originalPosRelativeToRoot.top}px`
        animatingOverlay.style.width = `${originalPosRelativeToRoot.width}px`
        animatingOverlay.style.height = `${originalPosRelativeToRoot.height}px`
        animatingOverlay.style.opacity = '0'
      })

      const cleanup = () => {
        animatingOverlay.remove()
        originalTilePosition = null

        if (refDiv) refDiv.remove()
        parent.style.transition = 'none'
        el.style.transition = 'none'

        parent.style.setProperty('--rot-y-delta', `0deg`)
        parent.style.setProperty('--rot-x-delta', `0deg`)

        requestAnimationFrame(() => {
          el.style.visibility = ''
          el.style.opacity = '0'
          el.style.zIndex = '0'
          focusedEl = null
          root?.removeAttribute('data-enlarging')

          requestAnimationFrame(() => {
            parent.style.transition = ''
            el.style.transition = 'opacity 300ms ease-out'

            requestAnimationFrame(() => {
              el.style.opacity = '1'
              setTimeout(() => {
                el.style.transition = ''
                el.style.opacity = ''
                opening = false
                if (!dragging && root?.getAttribute('data-enlarging') !== 'true') {
                  document.body.classList.remove('dg-scroll-lock')
                }
              }, 300)
            })
          })
        })
      }

      animatingOverlay.addEventListener('transitionend', cleanup, {
        once: true,
      })
    }

    sc.addEventListener('click', close)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)

    onCleanup(() => {
      sc.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
    })
  })

  onCleanup(() => {
    document.body.classList.remove('dg-scroll-lock')
  })

  const cssStyles = `
    .sphere-root {
      --radius: 520px;
      --viewer-pad: 72px;
      --circ: calc(var(--radius) * 3.14);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }

    .sphere-root * { box-sizing: border-box; }
    .sphere, .sphere-item, .item__image { transform-style: preserve-3d; }

    .stage {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      position: absolute;
      inset: 0;
      margin: auto;
      perspective: calc(var(--radius) * 2);
      perspective-origin: 50% 50%;
    }

    .sphere {
      transform: translateZ(calc(var(--radius) * -1));
      will-change: transform;
      position: absolute;
    }

    .sphere-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute;
      top: -999px;
      bottom: -999px;
      left: -999px;
      right: -999px;
      margin: auto;
      transform-origin: 50% 50%;
      backface-visibility: hidden;
      transition: transform 300ms;
      transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg)))
                 rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg)))
                 translateZ(var(--radius));
    }

    .sphere-root[data-enlarging="true"] .scrim {
      opacity: 1 !important;
      pointer-events: all !important;
    }

    @media (max-aspect-ratio: 1/1) {
      .viewer-frame {
        height: auto !important;
        width: 100% !important;
      }
    }

    .item__image {
      position: absolute;
      inset: 10px;
      border-radius: var(--tile-radius, 12px);
      overflow: hidden;
      cursor: pointer;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transition: transform 300ms;
      pointer-events: auto;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    .item__image--reference {
      position: absolute;
      inset: 10px;
      pointer-events: none;
    }
  `

  const overlayColor = () => props.overlayBlurColor ?? '#120F17'
  const grayscale = () => props.grayscale ?? true

  return (
    <>
      <style>{cssStyles}</style>
      <div
        ref={root}
        class="sphere-root relative w-full h-full"
        style={
          {
            '--segments-x': props.segments ?? DEFAULTS.segments,
            '--segments-y': props.segments ?? DEFAULTS.segments,
            '--overlay-blur-color': overlayColor(),
            '--tile-radius': props.imageBorderRadius ?? '30px',
            '--enlarge-radius': props.openedImageBorderRadius ?? '30px',
            '--image-filter': grayscale() ? 'grayscale(1)' : 'none',
          } as JSX.CSSProperties
        }
      >
        <main
          ref={main}
          class="absolute inset-0 grid place-items-center overflow-hidden select-none"
          style={{
            'touch-action': 'none',
            '-webkit-user-select': 'none',
            'background-color': `var(--overlay-blur-color, ${overlayColor()})`,
          }}
        >
          <div class="stage">
            <div ref={sphere} class="sphere">
              <For each={items()}>
                {it => (
                  <div
                    class="sphere-item absolute m-auto"
                    data-src={it.src}
                    data-alt={it.alt}
                    data-offset-x={it.x}
                    data-offset-y={it.y}
                    data-size-x={it.sizeX}
                    data-size-y={it.sizeY}
                    style={
                      {
                        '--offset-x': it.x,
                        '--offset-y': it.y,
                        '--item-size-x': it.sizeX,
                        '--item-size-y': it.sizeY,
                        top: '-999px',
                        bottom: '-999px',
                        left: '-999px',
                        right: '-999px',
                      } as JSX.CSSProperties
                    }
                  >
                    <div
                      class="item__image absolute block overflow-hidden cursor-pointer transition-transform duration-300"
                      role="button"
                      tabIndex={0}
                      aria-label={it.alt || 'Open image'}
                      onClick={e => {
                        if (dragging) return
                        if (moved) return
                        if (performance.now() - lastDragEndAt < 80) return
                        if (opening) return
                        openItemFromElement(e.currentTarget)
                      }}
                      onPointerUp={e => {
                        if (e.pointerType !== 'touch') return
                        if (dragging) return
                        if (moved) return
                        if (performance.now() - lastDragEndAt < 80) return
                        if (opening) return
                        openItemFromElement(e.currentTarget)
                      }}
                      style={{
                        inset: '10px',
                        'border-radius': `var(--tile-radius, ${props.imageBorderRadius ?? '30px'})`,
                        'backface-visibility': 'hidden',
                        'background-color': `var(--overlay-blur-color, ${overlayColor()})`,
                      }}
                    >
                      <img
                        src={it.src}
                        draggable={false}
                        alt={it.alt}
                        class="w-full h-full object-cover pointer-events-none"
                        style={{
                          'backface-visibility': 'hidden',
                          filter: `var(--image-filter, ${grayscale() ? 'grayscale(1)' : 'none'})`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div
            class="absolute inset-0 m-auto z-[3] pointer-events-none"
            style={{
              'background-image': `radial-gradient(rgba(235, 235, 235, 0) 65%, var(--overlay-blur-color, ${overlayColor()}) 100%)`,
            }}
          />

          <div
            class="absolute inset-0 m-auto z-[3] pointer-events-none"
            style={{
              '-webkit-mask-image': `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayColor()}) 90%)`,
              'mask-image': `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayColor()}) 90%)`,
              'backdrop-filter': 'blur(3px)',
            }}
          />

          <div
            class="absolute left-0 right-0 top-0 h-[120px] z-[5] pointer-events-none rotate-180"
            style={{
              background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayColor()}))`,
            }}
          />
          <div
            class="absolute left-0 right-0 bottom-0 h-[120px] z-[5] pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayColor()}))`,
            }}
          />

          <div
            ref={viewer}
            class="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
            style={{ padding: 'var(--viewer-pad)' }}
          >
            <div
              ref={scrim}
              class="scrim absolute inset-0 z-10 pointer-events-none opacity-0 transition-opacity duration-500"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                'backdrop-filter': 'blur(3px)',
              }}
            />
            <div
              ref={frame}
              class="viewer-frame h-full aspect-square flex"
              style={{
                'border-radius': `var(--enlarge-radius, ${props.openedImageBorderRadius ?? '30px'})`,
              }}
            />
          </div>
        </main>
      </div>
    </>
  )
}
