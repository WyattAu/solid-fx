import { createEffect, createSignal, For, Index, onCleanup } from 'solid-js'
import type { JSX } from 'solid-js'
import { gsap } from 'gsap'

export interface StaggeredMenuItem {
  label: string
  ariaLabel: string
  link: string
}
export interface StaggeredMenuSocialItem {
  label: string
  link: string
}
export interface StaggeredMenuProps {
  position?: 'left' | 'right'
  colors?: string[]
  items?: StaggeredMenuItem[]
  socialItems?: StaggeredMenuSocialItem[]
  displaySocials?: boolean
  displayItemNumbering?: boolean
  className?: string
  class?: string
  logoUrl?: string
  menuButtonColor?: string
  openMenuButtonColor?: string
  accentColor?: string
  isFixed: boolean
  changeMenuColorOnOpen?: boolean
  closeOnClickAway?: boolean
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

export const StaggeredMenu = (props: StaggeredMenuProps) => {
  const [open, setOpen] = createSignal(false)
  let openState = false

  let panelRef!: HTMLDivElement
  let preLayersRef!: HTMLDivElement
  let preLayerEls: HTMLElement[] = []

  let plusHRef!: HTMLSpanElement
  let plusVRef!: HTMLSpanElement
  let iconRef!: HTMLSpanElement

  let textInnerRef!: HTMLSpanElement
  const [textLines, setTextLines] = createSignal<string[]>(['Menu', 'Close'])

  let openTl: gsap.core.Timeline | null = null
  let closeTween: gsap.core.Tween | null = null
  let spinTween: gsap.core.Timeline | null = null
  let textCycleAnim: gsap.core.Tween | null = null
  let colorTween: gsap.core.Tween | null = null

  let toggleBtnRef!: HTMLButtonElement
  let busy = false

  // Upstream deps: [menuButtonColor, position]
  createEffect(() => {
    const menuButtonColor = props.menuButtonColor ?? '#fff'
    const position = props.position ?? 'right'
    const ctx = gsap.context(() => {
      const panel = panelRef
      const preContainer = preLayersRef

      const plusH = plusHRef
      const plusV = plusVRef
      const icon = iconRef
      const textInner = textInnerRef

      if (!panel || !plusH || !plusV || !icon || !textInner) return

      let preLayers: HTMLElement[] = []
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[]
      }
      preLayerEls = preLayers

      const offscreen = position === 'left' ? -100 : 100
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 })
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 })
      }

      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 })
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 })
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' })

      gsap.set(textInner, { yPercent: 0 })

      if (toggleBtnRef) gsap.set(toggleBtnRef, { color: menuButtonColor })
    })
    onCleanup(() => ctx.revert())
  })

  const buildOpenTimeline = (): gsap.core.Timeline | null => {
    const position = props.position ?? 'right'
    const panel = panelRef
    const layers = preLayerEls
    if (!panel) return null

    openTl?.kill()
    if (closeTween) {
      closeTween.kill()
      closeTween = null
    }

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[]
    const numberEls = Array.from(
      panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'),
    ) as HTMLElement[]
    const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[]

    const offscreen = position === 'left' ? -100 : 100
    const layerStates = layers.map(el => ({ el, start: offscreen }))
    const panelStart = offscreen

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 })
    if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 })
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 })
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 })

    const tl = gsap.timeline({ paused: true })

    layerStates.forEach((ls, i) => {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.5, ease: 'power4.out' },
        i * 0.07,
      )
    })

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0)
    const panelDuration = 0.65

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime,
    )

    if (itemEls.length) {
      const itemsStartRatio = 0.15
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio

      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' },
        },
        itemsStart,
      )

      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' },
          },
          itemsStart + 0.1,
        )
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4

      if (socialTitle)
        tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart)
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' })
            },
          },
          socialsStart + 0.04,
        )
      }
    }

    openTl = tl
    return tl
  }

  const playOpen = () => {
    if (busy) return
    busy = true
    const tl = buildOpenTimeline()
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busy = false
      })
      tl.play(0)
    } else {
      busy = false
    }
  }

  const playClose = () => {
    const position = props.position ?? 'right'
    openTl?.kill()
    openTl = null

    const panel = panelRef
    const layers = preLayerEls
    if (!panel) return

    const all: HTMLElement[] = [...layers, panel]
    closeTween?.kill()

    const offscreen = position === 'left' ? -100 : 100

    closeTween = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[]
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 })

        const numberEls = Array.from(
          panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'),
        ) as HTMLElement[]
        if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 })

        const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[]
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 })
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 })

        busy = false
      },
    })
  }

  const animateIcon = (opening: boolean) => {
    const icon = iconRef
    const h = plusHRef
    const v = plusVRef
    if (!icon || !h || !v) return

    spinTween?.kill()

    if (opening) {
      // ensure container never rotates
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' })
      spinTween = gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .to(h, { rotate: 45, duration: 0.5 }, 0)
        .to(v, { rotate: -45, duration: 0.5 }, 0)
    } else {
      spinTween = gsap
        .timeline({ defaults: { ease: 'power3.inOut' } })
        .to(h, { rotate: 0, duration: 0.35 }, 0)
        .to(v, { rotate: 90, duration: 0.35 }, 0)
        .to(icon, { rotate: 0, duration: 0.001 }, 0)
    }
  }

  const animateColor = (opening: boolean) => {
    const btn = toggleBtnRef
    if (!btn) return
    colorTween?.kill()
    const changeMenuColorOnOpen = props.changeMenuColorOnOpen ?? true
    const menuButtonColor = props.menuButtonColor ?? '#fff'
    const openMenuButtonColor = props.openMenuButtonColor ?? '#fff'
    if (changeMenuColorOnOpen) {
      const targetColor = opening ? openMenuButtonColor : menuButtonColor
      colorTween = gsap.to(btn, {
        color: targetColor,
        delay: 0.18,
        duration: 0.3,
        ease: 'power2.out',
      })
    } else {
      gsap.set(btn, { color: menuButtonColor })
    }
  }

  createEffect(() => {
    // Upstream deps: [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]
    const changeMenuColorOnOpen = props.changeMenuColorOnOpen ?? true
    const menuButtonColor = props.menuButtonColor ?? '#fff'
    const openMenuButtonColor = props.openMenuButtonColor ?? '#fff'
    if (toggleBtnRef) {
      if (changeMenuColorOnOpen) {
        const targetColor = openState ? openMenuButtonColor : menuButtonColor
        gsap.set(toggleBtnRef, { color: targetColor })
      } else {
        gsap.set(toggleBtnRef, { color: menuButtonColor })
      }
    }
  })

  const animateText = (opening: boolean) => {
    const inner = textInnerRef
    if (!inner) return

    textCycleAnim?.kill()

    const currentLabel = opening ? 'Menu' : 'Close'
    const targetLabel = opening ? 'Close' : 'Menu'
    const cycles = 3

    const seq: string[] = [currentLabel]
    let last = currentLabel
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu'
      seq.push(last)
    }
    if (last !== targetLabel) seq.push(targetLabel)
    seq.push(targetLabel)

    setTextLines(seq)
    gsap.set(inner, { yPercent: 0 })

    const lineCount = seq.length
    const finalShift = ((lineCount - 1) / lineCount) * 100

    textCycleAnim = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out',
    })
  }

  const toggleMenu = () => {
    const target = !openState
    openState = target
    setOpen(target)

    if (target) {
      props.onMenuOpen?.()
      playOpen()
    } else {
      props.onMenuClose?.()
      playClose()
    }

    animateIcon(target)
    animateColor(target)
    animateText(target)
  }

  const closeMenu = () => {
    if (openState) {
      openState = false
      setOpen(false)
      props.onMenuClose?.()
      playClose()
      animateIcon(false)
      animateColor(false)
      animateText(false)
    }
  }

  createEffect(() => {
    // Upstream deps: [closeOnClickAway, open, closeMenu]
    const isOpen = open()
    if (!(props.closeOnClickAway ?? true) || !isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef &&
        !panelRef.contains(event.target as Node) &&
        toggleBtnRef &&
        !toggleBtnRef.contains(event.target as Node)
      ) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside)
    })
  })

  const layers = (): string[] => {
    const raw = props.colors?.length ? props.colors.slice(0, 4) : ['#1e1e22', '#35353c']
    const arr = [...raw]
    if (arr.length >= 3) {
      const mid = Math.floor(arr.length / 2)
      arr.splice(mid, 1)
    }
    return arr
  }

  return (
    <div
      class={`sm-scope z-40 ${props.isFixed ? 'fixed top-0 left-0 w-screen h-screen overflow-hidden' : 'w-full h-full'}`}
    >
      <div
        class={`${
          props.class || props.className
            ? `${`${props.class ?? ''} ${props.className ?? ''} `.trim()} `
            : ''
        }staggered-menu-wrapper pointer-events-none relative w-full h-full z-40`}
        style={{ '--sm-accent': props.accentColor ?? '#5227FF' } as JSX.CSSProperties}
        data-position={props.position ?? 'right'}
        data-open={open() || undefined}
      >
        <div
          ref={preLayersRef}
          class="sm-prelayers absolute top-0 right-0 bottom-0 pointer-events-none z-[5]"
          aria-hidden="true"
        >
          <For each={layers()}>
            {c => (
              <div
                class="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0"
                style={{ background: c }}
              />
            )}
          </For>
        </div>

        <header
          class="staggered-menu-header absolute top-0 left-0 w-full flex items-center justify-between p-[2em] bg-transparent pointer-events-none z-20"
          aria-label="Main navigation header"
        >
          <div class="sm-logo flex items-center select-none pointer-events-auto" aria-label="Logo">
            <img
              src={props.logoUrl || '/src/assets/logos/reactbits-gh-white.svg'}
              alt="Logo"
              class="sm-logo-img block h-8 w-auto object-contain"
              draggable={false}
              width={110}
              height={24}
            />
          </div>

          <button
            ref={toggleBtnRef}
            class={`sm-toggle relative inline-flex items-center gap-[0.3rem] bg-transparent border-0 cursor-pointer font-medium leading-none overflow-visible pointer-events-auto ${
              open() ? 'text-black' : 'text-[#e9e9ef]'
            }`}
            aria-label={open() ? 'Close menu' : 'Open menu'}
            aria-expanded={open()}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            type="button"
          >
            <span
              class="sm-toggle-textWrap relative inline-block h-[1em] overflow-hidden whitespace-nowrap w-[var(--sm-toggle-width,auto)] min-w-[var(--sm-toggle-width,auto)]"
              aria-hidden="true"
            >
              <span ref={textInnerRef} class="sm-toggle-textInner flex flex-col leading-none">
                <Index each={textLines()}>
                  {l => <span class="sm-toggle-line block h-[1em] leading-none">{l()}</span>}
                </Index>
              </span>
            </span>

            <span
              ref={iconRef}
              class="sm-icon relative w-[14px] h-[14px] shrink-0 inline-flex items-center justify-center [will-change:transform]"
              aria-hidden="true"
            >
              <span
                ref={plusHRef}
                class="sm-icon-line absolute left-1/2 top-1/2 w-full h-[2px] bg-current rounded-[2px] -translate-x-1/2 -translate-y-1/2 [will-change:transform]"
              />
              <span
                ref={plusVRef}
                class="sm-icon-line sm-icon-line-v absolute left-1/2 top-1/2 w-full h-[2px] bg-current rounded-[2px] -translate-x-1/2 -translate-y-1/2 [will-change:transform]"
              />
            </span>
          </button>
        </header>

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          class="staggered-menu-panel absolute top-0 right-0 h-full bg-white flex flex-col p-[6em_2em_2em_2em] overflow-y-auto z-10 backdrop-blur-[12px] pointer-events-auto"
          style={{ '-webkit-backdrop-filter': 'blur(12px)' }}
          aria-hidden={!open()}
        >
          <div class="sm-panel-inner flex-1 flex flex-col gap-5">
            <ul
              class="sm-panel-list list-none m-0 p-0 flex flex-col gap-2"
              data-numbering={(props.displayItemNumbering ?? true) ? '' : undefined}
            >
              {props.items?.length ? (
                <For each={props.items}>
                  {(it, idx) => (
                    <li class="sm-panel-itemWrap relative overflow-hidden leading-none">
                      <a
                        class="sm-panel-item relative text-black font-semibold text-[4rem] cursor-pointer leading-none tracking-[-2px] uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline pr-[1.4em]"
                        href={it.link}
                        aria-label={it.ariaLabel}
                        data-index={idx() + 1}
                      >
                        <span class="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                          {it.label}
                        </span>
                      </a>
                    </li>
                  )}
                </For>
              ) : (
                <li
                  class="sm-panel-itemWrap relative overflow-hidden leading-none"
                  aria-hidden="true"
                >
                  <span class="sm-panel-item relative text-black font-semibold text-[4rem] cursor-pointer leading-none tracking-[-2px] uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline pr-[1.4em]">
                    <span class="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                      No items
                    </span>
                  </span>
                </li>
              )}
            </ul>

            {(props.displaySocials ?? true) &&
              props.socialItems &&
              props.socialItems.length > 0 && (
                <div class="sm-socials mt-auto pt-8 flex flex-col gap-3" aria-label="Social links">
                  <h3 class="sm-socials-title m-0 text-base font-medium [color:var(--sm-accent,#ff0000)]">
                    Socials
                  </h3>
                  <ul class="sm-socials-list list-none m-0 p-0 flex flex-row items-center gap-4 flex-wrap">
                    <For each={props.socialItems}>
                      {(s, _i) => (
                        <li class="sm-socials-item">
                          <a
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="sm-socials-link text-[1.2rem] font-medium text-[#111] no-underline relative inline-block py-[2px] transition-[color,opacity] duration-300 ease-linear"
                          >
                            {s.label}
                          </a>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              )}
          </div>
        </aside>
      </div>

      <style>{`
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 2em; background: transparent; pointer-events: none; z-index: 20; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .sm-logo { display: flex; align-items: center; user-select: none; }
.sm-scope .sm-logo-img { display: block; height: 32px; width: auto; object-fit: contain; }
.sm-scope .sm-toggle { position: relative; display: inline-flex; align-items: center; gap: 0.3rem; background: transparent; border: none; cursor: pointer; color: #e9e9ef; font-weight: 500; line-height: 1; overflow: visible; }
.sm-scope .sm-toggle:focus-visible { outline: 2px solid #ffffffaa; outline-offset: 4px; border-radius: 4px; }
.sm-scope .sm-line:last-of-type { margin-top: 6px; }
.sm-scope .sm-toggle-textWrap { position: relative; margin-right: 0.5em; display: inline-block; height: 1em; overflow: hidden; white-space: nowrap; width: var(--sm-toggle-width, auto); min-width: var(--sm-toggle-width, auto); }
.sm-scope .sm-toggle-textInner { display: flex; flex-direction: column; line-height: 1; }
.sm-scope .sm-toggle-line { display: block; height: 1em; line-height: 1; }
.sm-scope .sm-icon { position: relative; width: 14px; height: 14px; flex: 0 0 14px; display: inline-flex; align-items: center; justify-content: center; will-change: transform; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }
.sm-scope .sm-icon-line { position: absolute; left: 50%; top: 50%; width: 100%; height: 2px; background: currentColor; border-radius: 2px; transform: translate(-50%, -50%); will-change: transform; }
.sm-scope .sm-line { display: none !important; }
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; width: clamp(260px, 38vw, 420px); height: 100%; background: white; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; padding: 6em 2em 2em 2em; overflow-y: auto; z-index: 10; }
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; }
.sm-scope .sm-prelayers { position: absolute; top: 0; right: 0; bottom: 0; width: clamp(260px, 38vw, 420px); pointer-events: none; z-index: 5; }
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer { position: absolute; top: 0; right: 0; height: 100%; width: 100%; transform: translateX(0); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.sm-scope .sm-socials { margin-top: auto; padding-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
.sm-scope .sm-socials-title { margin: 0; font-size: 1rem; font-weight: 500; color: var(--sm-accent, #ff0000); }
.sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sm-scope .sm-socials-list .sm-socials-link { opacity: 1; transition: opacity 0.3s ease; }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: 0.35; }
.sm-scope .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) { opacity: 0.35; }
.sm-scope .sm-socials-list .sm-socials-link:hover,
.sm-scope .sm-socials-list .sm-socials-link:focus-visible { opacity: 1; }
.sm-scope .sm-socials-link:focus-visible { outline: 2px solid var(--sm-accent, #ff0000); outline-offset: 3px; }
.sm-scope .sm-socials-link { font-size: 1.2rem; font-weight: 500; color: #111; text-decoration: none; position: relative; padding: 2px 0; display: inline-block; transition: color 0.3s ease, opacity 0.3s ease; }
.sm-scope .sm-socials-link:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-title { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; text-transform: uppercase; }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.sm-scope .sm-panel-item { position: relative; color: #000; font-weight: 600; font-size: 4rem; cursor: pointer; line-height: 1; letter-spacing: -2px; text-transform: uppercase; transition: background 0.25s, color 0.25s; display: inline-block; text-decoration: none; padding-right: 1.4em; }
.sm-scope .sm-panel-itemLabel { display: inline-block; will-change: transform; transform-origin: 50% 100%; }
.sm-scope .sm-panel-item:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); position: absolute; top: 0.1em; right: 3.2em; font-size: 18px; font-weight: 400; color: var(--sm-accent, #ff0000); letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); }
@media (max-width: 1024px) { .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; } .sm-scope .sm-prelayers { width: 100%; } .sm-scope .staggered-menu-wrapper[data-open] .sm-logo-img { filter: invert(100%); } }
@media (max-width: 640px) { .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; } .sm-scope .sm-prelayers { width: 100%; } .sm-scope .staggered-menu-wrapper[data-open] .sm-logo-img { filter: invert(100%); } }
      `}</style>
    </div>
  )
}

export default StaggeredMenu
