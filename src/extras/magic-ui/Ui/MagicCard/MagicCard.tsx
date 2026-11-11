// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/magic-card.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { createEffect, createSignal, onCleanup, onMount, splitProps, Show } from 'solid-js'
import type { JSX } from 'solid-js'

interface MagicCardBaseProps {
  children?: JSX.Element
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  /** Imperative element ref (forwardRef parity). */
  ref?: (el: HTMLDivElement) => void
  gradientSize?: number
  gradientFrom?: string
  gradientTo?: string
}

interface MagicCardGradientProps extends MagicCardBaseProps {
  mode?: 'gradient'

  gradientColor?: string
  gradientOpacity?: number

  glowFrom?: never
  glowTo?: never
  glowAngle?: never
  glowSize?: never
  glowBlur?: never
  glowOpacity?: never
}

interface MagicCardOrbProps extends MagicCardBaseProps {
  mode: 'orb'

  glowFrom?: string
  glowTo?: string
  glowAngle?: number
  glowSize?: number
  glowBlur?: number
  glowOpacity?: number

  gradientColor?: never
  gradientOpacity?: never
}

type MagicCardProps = MagicCardGradientProps | MagicCardOrbProps
type ResetReason = 'enter' | 'leave' | 'global' | 'init'

/**
 * PORT-NOTE: upstream drives the orb smoothing through `useSpring` from
 * motion/react; the vanilla `motion` package has no spring source, so this is
 * a semi-implicit Euler spring integrator (same stiffness/damping/mass) in a
 * rAF loop that parks itself once settled. (A shared helper would live in
 * `@/lib`, which this batch may not touch — lift it there later.)
 */
function createSpringSignal(
  initial: number,
  config: { stiffness: number; damping: number; mass?: number },
) {
  const [value, setValue] = createSignal(initial)
  const mass = config.mass ?? 1
  const STEP = 1 / 60

  let x = initial
  let v = 0
  let target = initial
  let rafId: number | null = null
  let lastTime: number | null = null

  const tick = (now: number) => {
    if (lastTime === null) lastTime = now
    let dt = (now - lastTime) / 1000
    lastTime = now
    // Clamp tab-throttle spikes so the integrator stays stable.
    if (dt > 0.25) dt = 0.25
    while (dt > 0) {
      const h = Math.min(STEP, dt)
      dt -= h
      const a = (-config.stiffness * (x - target) - config.damping * v) / mass
      v += a * h
      x += v * h
    }
    setValue(x)
    if (Math.abs(x - target) < 0.01 && Math.abs(v) < 0.01) {
      x = target
      v = 0
      setValue(target)
      rafId = null
      lastTime = null
      return
    }
    rafId = requestAnimationFrame(tick)
  }

  const set = (next: number) => {
    target = next
    if (rafId === null) {
      lastTime = null
      rafId = requestAnimationFrame(tick)
    }
  }

  onCleanup(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  return { value, set }
}

/**
 * MagicCard
 *
 * A card with a pointer-following gradient border and either a spotlight
 * gradient (`mode="gradient"`, default) or a spring-damped glow orb
 * (`mode="orb"`).
 *
 * PORT-NOTE: upstream's background uses `useMotionTemplate`; Solid rewrites
 * it as an effect that recomposes the template string from reactive values.
 * Upstream also reads next-themes' `useTheme()` for the orb's blend mode —
 * this site has no theme provider, so dark mode resolves from the document
 * root's `dark` class with a `prefers-color-scheme` fallback, defaulting to
 * dark exactly like upstream does pre-hydration. Finally, upstream assumes
 * the shadcn theme tokens `--color-background`/`--color-border`; fallbacks
 * keep the card opaque on sites without those tokens (dark, matching
 * upstream's dark default).
 */
export const MagicCard = (props: MagicCardProps) => {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'ref',
    'gradientSize',
    'gradientColor',
    'gradientOpacity',
    'gradientFrom',
    'gradientTo',
    'mode',
    'glowFrom',
    'glowTo',
    'glowAngle',
    'glowSize',
    'glowBlur',
    'glowOpacity',
  ])

  const mode = () => own.mode ?? 'gradient'
  const gradientSize = () => own.gradientSize ?? 200
  const gradientColor = () => own.gradientColor ?? '#262626'
  const gradientOpacity = () => own.gradientOpacity ?? 0.8
  const gradientFrom = () => own.gradientFrom ?? '#9E7AFF'
  const gradientTo = () => own.gradientTo ?? '#FE8BBB'

  // Upstream keeps the orb constants behind isOrbMode ternaries; the
  // non-orb branch yields the same fallback constants, so read them directly.
  const glowFrom = () => own.glowFrom ?? '#ee4f27'
  const glowTo = () => own.glowTo ?? '#6b21ef'
  const glowAngle = () => own.glowAngle ?? 90
  const glowSize = () => own.glowSize ?? 420
  const glowBlur = () => own.glowBlur ?? 60
  const glowOpacity = () => own.glowOpacity ?? 0.9

  // Upstream: const { theme, systemTheme } = useTheme(); useState(mounted);
  // isDarkTheme defaults true until mounted.
  const [isDarkTheme, setIsDarkTheme] = createSignal(true)

  onMount(() => {
    const root = document.documentElement
    const update = () => {
      if (root.classList.contains('dark')) setIsDarkTheme(true)
      else if (root.classList.contains('light')) setIsDarkTheme(false)
      else setIsDarkTheme(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    onCleanup(() => observer.disconnect())
  })

  // Upstream: mouseX/mouseY motion values start at -gradientSize.
  const [mouseX, setMouseX] = createSignal(-gradientSize())
  const [mouseY, setMouseY] = createSignal(-gradientSize())

  // Upstream: useSpring(mouseX/mouseY, { stiffness: 250, damping: 30,
  // mass: 0.6 }) and orbVisible spring { stiffness: 300, damping: 35 }.
  const orbX = createSpringSignal(-gradientSize(), {
    stiffness: 250,
    damping: 30,
    mass: 0.6,
  })
  const orbY = createSpringSignal(-gradientSize(), {
    stiffness: 250,
    damping: 30,
    mass: 0.6,
  })
  const orbVisible = createSpringSignal(0, {
    stiffness: 300,
    damping: 35,
  })

  let cardRef!: HTMLDivElement

  // Upstream: reset(useCallback) reads modeRef/glowOpacityRef/gradientSizeRef;
  // Solid reads the accessors directly.
  const reset = (reason: ResetReason = 'leave') => {
    if (mode() === 'orb') {
      if (reason === 'enter') orbVisible.set(glowOpacity())
      else orbVisible.set(0)
      return
    }

    const off = -gradientSize()
    setMouseX(off)
    setMouseY(off)
    orbX.set(off)
    orbY.set(off)
  }

  const handlePointerMove = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement | null
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMouseX(x)
    setMouseY(y)
    orbX.set(x)
    orbY.set(y)
  }

  // Upstream: useEffect([reset]) → reset('init').
  onMount(() => reset('init'))

  // Upstream: useEffect([reset]) — global pointer-out / blur / tab-hide
  // listeners reset the effect when the pointer truly leaves the window.
  onMount(() => {
    const handleGlobalPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) reset('global')
    }
    const handleBlur = () => reset('global')
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') reset('global')
    }

    window.addEventListener('pointerout', handleGlobalPointerOut)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibility)

    onCleanup(() => {
      window.removeEventListener('pointerout', handleGlobalPointerOut)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibility)
    })
  })

  // Upstream: style={{ background: useMotionTemplate`...${mouseX}...` }}.
  createEffect(() => {
    const el = cardRef
    if (!el) return
    el.style.background = `
          linear-gradient(var(--color-background, #0a0a0a) 0 0) padding-box,
          radial-gradient(${gradientSize()}px circle at ${mouseX()}px ${mouseY()}px,
            ${gradientFrom()},
            ${gradientTo()},
            var(--color-border, #262626) 100%
          ) border-box
        `
  })

  return (
    <div
      ref={el => {
        cardRef = el
        own.ref?.(el)
      }}
      class={`group relative isolate overflow-hidden rounded-[inherit] border border-transparent ${own.class ?? ''} ${own.className ?? ''}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => reset('leave')}
      onPointerEnter={() => reset('enter')}
      {...rest}
    >
      <div
        class="absolute inset-px z-20 rounded-[inherit]"
        style={{ 'background-color': 'var(--color-background, #0a0a0a)' }}
      />

      <Show when={mode() === 'gradient'}>
        <div
          // Upstream's suppressHydrationWarning is a React-only directive;
          // dropped.
          class="pointer-events-none absolute inset-px z-30 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ opacity: String(gradientOpacity()) }}
          ref={overlay => {
            createEffect(() => {
              overlay.style.background = `
              radial-gradient(${gradientSize()}px circle at ${mouseX()}px ${mouseY()}px,
                ${gradientColor()},
                transparent 100%
              )
            `
            })
          }}
        />
      </Show>

      <Show when={mode() === 'orb'}>
        <div
          aria-hidden="true"
          class="pointer-events-none absolute z-30"
          ref={orbEl => {
            createEffect(() => {
              orbEl.style.width = `${glowSize()}px`
              orbEl.style.height = `${glowSize()}px`
              // Upstream composes x/y motion values with translateX/Y -50%
              // (translations commute, so the order matches visually).
              orbEl.style.transform = `translate(${orbX.value()}px, ${orbY.value()}px) translate(-50%, -50%)`
              orbEl.style.borderRadius = '9999px'
              orbEl.style.filter = `blur(${glowBlur()}px)`
              orbEl.style.opacity = String(orbVisible.value())
              orbEl.style.background = `linear-gradient(${glowAngle()}deg, ${glowFrom()}, ${glowTo()})`
              orbEl.style.mixBlendMode = isDarkTheme() ? 'screen' : 'multiply'
              orbEl.style.willChange = 'transform, opacity'
            })
          }}
        />
      </Show>
      <div class="relative z-40">{own.children}</div>
    </div>
  )
}

export default MagicCard
