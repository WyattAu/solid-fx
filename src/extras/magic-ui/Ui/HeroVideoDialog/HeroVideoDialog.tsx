// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/hero-video-dialog.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// PORT-NOTE: lucide-react's Play / XIcon are inlined as equivalent SVG markup
// (lucide is ISC-licensed); <AnimatePresence> exit is restructured as
// exit-then-unmount per PORTING.md §5.

import { animate } from 'motion'
import { createEffect, createSignal, onCleanup, splitProps, untrack } from 'solid-js'

// Type of the controls `animate()` returns (has .stop() and .finished).
type MotionControls = ReturnType<typeof animate>

type AnimationStyle =
  | 'from-bottom'
  | 'from-center'
  | 'from-top'
  | 'from-left'
  | 'from-right'
  | 'fade'
  | 'top-in-bottom-out'
  | 'left-in-right-out'

interface HeroVideoProps {
  animationStyle?: AnimationStyle
  videoSrc: string
  thumbnailSrc: string
  thumbnailAlt?: string
  className?: string
  class?: string
}

type VariantKeyframes = Record<string, (string | number)[]>

// Upstream: animationVariants keyed by style, each with initial/animate/exit.
// The port stores the same pairs as enter/exit keyframe sets.
const animationVariants: Record<
  AnimationStyle,
  { enter: VariantKeyframes; exit: VariantKeyframes }
> = {
  'from-bottom': {
    enter: { y: ['100%', '0%'], opacity: [0, 1] },
    exit: { y: ['0%', '100%'], opacity: [1, 0] },
  },
  'from-center': {
    enter: { scale: [0.5, 1], opacity: [0, 1] },
    exit: { scale: [1, 0.5], opacity: [1, 0] },
  },
  'from-top': {
    enter: { y: ['-100%', '0%'], opacity: [0, 1] },
    exit: { y: ['0%', '-100%'], opacity: [1, 0] },
  },
  'from-left': {
    enter: { x: ['-100%', '0%'], opacity: [0, 1] },
    exit: { x: ['0%', '-100%'], opacity: [1, 0] },
  },
  'from-right': {
    enter: { x: ['100%', '0%'], opacity: [0, 1] },
    exit: { x: ['0%', '100%'], opacity: [1, 0] },
  },
  fade: {
    enter: { opacity: [0, 1] },
    exit: { opacity: [1, 0] },
  },
  'top-in-bottom-out': {
    enter: { y: ['-100%', '0%'], opacity: [0, 1] },
    exit: { y: ['0%', '100%'], opacity: [1, 0] },
  },
  'left-in-right-out': {
    enter: { x: ['-100%', '0%'], opacity: [0, 1] },
    exit: { x: ['0%', '100%'], opacity: [1, 0] },
  },
}

// Upstream overlay: motion.div with initial/animate/exit opacity — framer's
// default 0.3s tween.
const OVERLAY_DURATION = 0.3

export function HeroVideoDialog(props: HeroVideoProps) {
  const [own, rest] = splitProps(props, [
    'animationStyle',
    'videoSrc',
    'thumbnailSrc',
    'thumbnailAlt',
    'class',
    'className',
  ])

  const animationStyle = () => own.animationStyle ?? 'from-center'
  const thumbnailAlt = () => own.thumbnailAlt ?? 'Video thumbnail'

  const [isVideoOpen, setIsVideoOpen] = createSignal(false)

  let overlayEl!: HTMLDivElement
  let panelEl!: HTMLDivElement

  let activeControls: MotionControls[] = []
  let closeToken = 0

  const stopActive = () => {
    for (const controls of activeControls) controls.stop()
    activeControls = []
  }
  onCleanup(stopActive)

  // Upstream: overlay initial/animate opacity + panel variant initial/animate
  // with spring { damping: 30, stiffness: 300 } (applied to opacity too).
  const playEnter = () => {
    stopActive()
    const variant = animationVariants[untrack(animationStyle)]
    activeControls = [
      animate(overlayEl, { opacity: [0, 1] }, { duration: OVERLAY_DURATION }),
      animate(panelEl, { ...variant.enter }, { type: 'spring', damping: 30, stiffness: 300 }),
    ]
  }

  // Upstream: AnimatePresence plays the overlay + variant exit before the
  // subtree unmounts; the port animates out, then removes via the signal.
  const close = () => {
    if (!untrack(isVideoOpen)) return
    stopActive()
    const variant = animationVariants[untrack(animationStyle)]
    const token = ++closeToken
    activeControls = [
      animate(overlayEl, { opacity: [1, 0] }, { duration: OVERLAY_DURATION }),
      animate(panelEl, { ...variant.exit }, { type: 'spring', damping: 30, stiffness: 300 }),
    ]
    void Promise.all(activeControls.map(controls => controls.finished)).then(() => {
      if (token === closeToken) setIsVideoOpen(false)
    })
  }

  // Enter plays after the dialog mounts.
  createEffect(() => {
    if (!isVideoOpen()) return
    untrack(() => playEnter())
  })

  const open = () => {
    closeToken++ // invalidate any pending close-then-unmount
    setIsVideoOpen(true)
  }

  const handleOverlayKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      close()
    }
  }

  return (
    <div {...rest} class={`relative ${own.class ?? ''} ${own.className ?? ''}`}>
      <button
        type="button"
        aria-label="Play video"
        class="group relative cursor-pointer border-0 bg-transparent p-0"
        onClick={open}
      >
        <img
          src={own.thumbnailSrc}
          alt={thumbnailAlt()}
          width={1920}
          height={1080}
          class="w-full rounded-md border shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.8]"
        />
        <div class="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
          <div class="bg-primary/10 flex size-28 items-center justify-center rounded-full backdrop-blur-md">
            <div class="from-primary/30 to-primary relative flex size-20 scale-100 items-center justify-center rounded-full bg-linear-to-b shadow-md transition-all duration-200 ease-out group-hover:scale-[1.2]">
              <svg
                class="size-8 scale-100 fill-white text-white transition-transform duration-200 ease-out group-hover:scale-105"
                style={{
                  filter:
                    'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))',
                }}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                {/* lucide Play */}
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            </div>
          </div>
        </div>
      </button>
      {isVideoOpen() && (
        <div
          ref={overlayEl}
          role="button"
          tabindex={0}
          onKeyDown={handleOverlayKeyDown}
          onClick={() => close()}
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
        >
          <div class="relative mx-4 aspect-video w-full max-w-4xl md:mx-0" ref={panelEl}>
            <button
              type="button"
              aria-label="Close video"
              class="absolute -top-16 right-0 rounded-full bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md dark:bg-neutral-100/50 dark:text-black"
            >
              <svg
                class="size-5"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                {/* lucide XIcon */}
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <div class="relative isolate z-1 size-full overflow-hidden rounded-2xl border-2 border-white">
              <iframe
                src={own.videoSrc}
                title="Hero Video player"
                class="mt-0 size-full rounded-2xl"
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HeroVideoDialog
