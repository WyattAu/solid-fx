import { createEffect, createMemo, onCleanup, onMount } from 'solid-js';
import { For } from 'solid-js';
import gsap from 'gsap';

export type DepthCarouselItem = string | { image: string; alt?: string };
type TiltDirection = 'left' | 'right';

export interface DepthCarouselProps {
  items?: DepthCarouselItem[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: TiltDirection;
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  onChange?: (index: number, item: { image: string; alt?: string }) => void;
  className?: string;
  class?: string;
}

interface CarouselConfig {
  count: number;
  depth: number;
  spread: number;
  tilt: number;
  tiltDirection: TiltDirection;
  visibleCards: number;
  falloff: number;
  blur: number;
  duration: number;
  ease: string;
  loop: boolean;
  cardWidth: number;
  autoplayDelay: number;
}

interface DragState {
  x: number;
  startPos: number;
  lastX: number;
  lastT: number;
  v: number;
  moved: boolean;
  id: number;
}

const DEFAULT_ITEMS: DepthCarouselItem[] = [
  { image: 'https://picsum.photos/seed/depth1/800/1000', alt: 'Slide 1' },
  { image: 'https://picsum.photos/seed/depth2/800/1000', alt: 'Slide 2' },
  { image: 'https://picsum.photos/seed/depth3/800/1000', alt: 'Slide 3' },
  { image: 'https://picsum.photos/seed/depth4/800/1000', alt: 'Slide 4' },
  { image: 'https://picsum.photos/seed/depth5/800/1000', alt: 'Slide 5' },
  { image: 'https://picsum.photos/seed/depth6/800/1000', alt: 'Slide 6' }
];

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeItem = (it: DepthCarouselItem) => (typeof it === 'string' ? { image: it, alt: '' } : it);

const DepthCarousel = (props: DepthCarouselProps) => {
  const data = createMemo(() => (Array.isArray(props.items) ? props.items : []).map(normalizeItem));
  const count = () => data().length;

  let root!: HTMLDivElement;
  let stage!: HTMLDivElement;
  const cardEls: (HTMLDivElement | null)[] = [];
  const overlayEls: (HTMLSpanElement | null)[] = [];

  let pos = 0;
  let focus = 0;
  let tween: gsap.core.Tween | null = null;
  let scale = 1;
  let wheelTimer: ReturnType<typeof setTimeout> | null = null;
  let autoTimer: ReturnType<typeof setInterval> | null = null;
  let reduced = false;
  let drag: DragState | null = null;
  let hoverEl: HTMLDivElement | null = null;

  const [active, setActive] = createSignal(0);

  const cfg = (): CarouselConfig => ({
    count: count(),
    depth: props.depth ?? 220,
    spread: props.spread ?? 90,
    tilt: props.tilt ?? 22,
    tiltDirection: props.tiltDirection ?? 'right',
    visibleCards: props.visibleCards ?? 4,
    falloff: props.falloff ?? 0.2,
    blur: props.blur ?? 6,
    duration: props.duration ?? 700,
    ease: props.ease ?? 'power3.out',
    loop: props.loop ?? true,
    cardWidth: props.cardWidth ?? 300,
    autoplayDelay: props.autoplayDelay ?? 3200
  });

  const layout = (p: number) => {
    const c = cfg();
    const n = c.count;
    if (!n) return;
    const dir = c.tiltDirection === 'left' ? -1 : 1;
    const sc = scale;

    for (let i = 0; i < n; i++) {
      const el = cardEls[i];
      if (!el) continue;

      let d = i - p;
      if (c.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }

      const back = Math.max(0, d);
      const az = Math.abs(d);
      const shown = az <= c.visibleCards + 0.5;

      const tz = -c.depth * d;
      const tx = dir * c.spread * d;
      const ry = dir * c.tilt * clamp(d, 0, 1);

      let opacity = d < 0 ? Math.max(0, 1 + d) : 1;
      if (!shown) opacity = 0;

      const brightness = Math.max(0.15, 1 - back * c.falloff);
      const blurPx = c.blur > 0 ? Math.min(c.blur, (back / Math.max(1, c.visibleCards)) * c.blur) : 0;
      const zi = Math.round(2000 - d * 20);

      el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      el.style.zIndex = String(zi);
      el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none';

      const ov = overlayEls[i];
      if (ov) ov.style.opacity = clamp(back * c.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  };

  const notify = (idx: number) => {
    setActive(idx);
    const item = data()[idx];
    if (item) props.onChange?.(idx, item);
  };

  const tweenTo = (target: number, animate: boolean) => {
    tween?.kill();
    const c = cfg();
    const proxy = { p: pos };
    const dur = animate && !reduced ? c.duration / 1000 : 0;
    tween = gsap.to(proxy, {
      p: target,
      duration: dur,
      ease: c.ease,
      onUpdate: () => {
        pos = proxy.p;
        layout(pos);
      },
      onComplete: () => {
        const n = c.count;
        if (n > 0) pos = ((pos % n) + n) % n;
        layout(pos);
      }
    });
  };

  const setFocus = (rawIndex: number, animate = true) => {
    const c = cfg();
    const n = c.count;
    if (!n) return;
    const idx = c.loop ? ((rawIndex % n) + n) % n : clamp(rawIndex, 0, n - 1);
    let delta = idx - pos;
    if (c.loop && n > 1) {
      delta = ((delta % n) + n) % n;
      if (delta > n / 2) delta -= n;
    }
    tweenTo(pos + delta, animate);
    if (idx !== focus) {
      focus = idx;
      notify(idx);
    }
  };

  const navigateBy = (step: number) => setFocus(focus + step, true);

  onMount(() => {
    // Upstream ResizeObserver effect (stable deps in React — mount only).
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const c = cfg();
      const needed = c.cardWidth + Math.abs(c.spread) * 2 + 120;
      scale = clamp(w / needed, 0.4, 1);
      layout(pos);
    });
    ro.observe(root);

    // Upstream wheel effect (stable deps — mount only).
    const onWheel = (e: WheelEvent) => {
      const c = cfg();
      if (c.count < 2) return;
      e.preventDefault();
      tween?.kill();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const delta = e.deltaMode === 1 ? raw * 24 : raw;
      const step = clamp(delta / (c.cardWidth * 0.9), -0.6, 0.6);
      pos += step;
      layout(pos);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => setFocus(Math.round(pos), true), 130);
    };
    root.addEventListener('wheel', onWheel, { passive: false });

    onCleanup(() => {
      ro.disconnect();
      root.removeEventListener('wheel', onWheel);
      tween?.kill();
      if (wheelTimer) clearTimeout(wheelTimer);
      if (autoTimer) clearInterval(autoTimer);
    });

    layout(pos);
  });

  // Upstream: useLayoutEffect re-layout on any geometry prop change.
  createEffect(() => {
    // Read every dep upstream listed.
    void props.depth;
    void props.spread;
    void props.tilt;
    void props.tiltDirection;
    void props.visibleCards;
    void props.falloff;
    void props.blur;
    void props.cardWidth;
    void props.cardHeight;
    void props.radius;
    void count();
    layout(pos);
  });

  // Upstream autoplay effect keyed on [autoplay, autoplayDelay, count].
  createEffect(() => {
    const autoplay = props.autoplay ?? false;
    const delay = props.autoplayDelay ?? 3200;
    const n = count();
    reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!autoplay || reduced || n < 2) return;
    let hovered = false;
    let focused = false;
    const stop = () => {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    };
    const start = () => {
      stop();
      autoTimer = setInterval(
        () => {
          if (!hovered && !focused) navigateBy(1);
        },
        Math.max(cfg().autoplayDelay, delay, 600)
      );
    };
    const onEnter = () => {
      hovered = true;
    };
    const onLeave = () => {
      hovered = false;
    };
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = () => {
      focused = false;
    };
    const el = hoverEl;
    el?.addEventListener('mouseenter', onEnter);
    el?.addEventListener('mouseleave', onLeave);
    el?.addEventListener('focusin', onFocusIn);
    el?.addEventListener('focusout', onFocusOut);
    start();
    onCleanup(() => {
      stop();
      el?.removeEventListener('mouseenter', onEnter);
      el?.removeEventListener('mouseleave', onLeave);
      el?.removeEventListener('focusin', onFocusIn);
      el?.removeEventListener('focusout', onFocusOut);
    });
  });

  const onPointerDown = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    const c = cfg();
    if (c.count < 2) return;
    tween?.kill();
    drag = {
      x: e.clientX,
      startPos: pos,
      lastX: e.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: e.pointerId
    };
  };

  const onPointerMove = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    if (!drag) return;
    const c = cfg();
    const stepPx = Math.max(c.cardWidth * 0.55 * scale, 40);
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) {
      drag.moved = true;
      root?.setPointerCapture(drag.id);
    }
    if (!drag.moved) return;
    const now = performance.now();
    const dt = Math.max(now - drag.lastT, 1);
    drag.v = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastT = now;
    pos = drag.startPos - dx / stepPx;
    layout(pos);
  };

  const onPointerEnd = () => {
    if (!drag) return;
    const current = drag;
    drag = null;
    if (!current.moved) return;
    const c = cfg();
    const stepPx = Math.max(c.cardWidth * 0.55 * scale, 40);
    const projected = pos - (current.v * 180) / stepPx;
    setFocus(Math.round(projected), true);
  };

  const onKeyDown = (e: KeyboardEvent & { currentTarget: HTMLDivElement }) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateBy(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateBy(1);
    }
  };

  const onCardClick = (index: number) => {
    if (drag?.moved) return;
    setFocus(index, true);
  };

  return (
    <div
      ref={el => {
        hoverEl = el;
        root = el;
      }}
      class={`relative flex h-full min-h-[320px] w-full cursor-grab touch-pan-y select-none items-center justify-center outline-none [perspective-origin:50%_50%] active:cursor-grabbing focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:[outline-offset:4px] ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={{ perspective: `${props.perspective ?? 1400}px` }}
      role="group"
      aria-roledescription="carousel"
      aria-label="Depth carousel"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div class="absolute inset-0 [transform-style:preserve-3d]" ref={stage}>
        <For each={data()}>
          {(item, i) => (
            <div
              class="absolute top-1/2 left-1/2 cursor-pointer overflow-hidden bg-[#0b0d12] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65),0_8px_20px_-10px_rgba(0,0,0,0.5)] [transform:translate(-50%,-50%)] [transform-origin:center] [will-change:transform,opacity,filter]"
              ref={el => {
                cardEls[i()] = el;
              }}
              style={{
                width: `${props.cardWidth ?? 300}px`,
                height: `${props.cardHeight ?? 380}px`,
                'border-radius': `${props.radius ?? 18}px`
              }}
              aria-roledescription="slide"
              aria-label={`${i() + 1} of ${count()}`}
              aria-hidden={active() !== i()}
              onClick={() => onCardClick(i())}
            >
              <img
                class="block h-full w-full select-none object-cover [pointer-events:none] [-webkit-user-drag:none]"
                src={item.image}
                alt={item.alt || ''}
                draggable={false}
              />
              <span
                class="pointer-events-none absolute inset-0 opacity-0 mix-blend-multiply"
                ref={el => {
                  overlayEls[i()] = el;
                }}
                style={{ background: props.tint ?? '#05060a' }}
              />
            </div>
          )}
        </For>
      </div>

      {(props.showControls ?? true) && count() > 1 && (
        <>
          <button
            type="button"
            class="absolute top-1/2 left-4 z-[3000] grid h-[42px] w-[42px] -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[rgba(18,20,26,0.55)] text-white backdrop-blur-md transition-[background,border-color,transform] duration-200 hover:border-white/40 hover:bg-[rgba(28,31,40,0.85)] active:scale-95"
            aria-label="Previous slide"
            onClick={() => navigateBy(-1)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            class="absolute top-1/2 right-4 z-[3000] grid h-[42px] w-[42px] -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[rgba(18,20,26,0.55)] text-white backdrop-blur-md transition-[background,border-color,transform] duration-200 hover:border-white/40 hover:bg-[rgba(28,31,40,0.85)] active:scale-95"
            aria-label="Next slide"
            onClick={() => navigateBy(1)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {(props.showIndicators ?? true) && count() > 1 && (
        <div
          class="absolute bottom-4 left-1/2 z-[3000] flex -translate-x-1/2 gap-2 rounded-full bg-[rgba(14,16,22,0.4)] px-3 py-2 backdrop-blur-sm"
          role="tablist"
          aria-label="Slides"
        >
          <For each={data()}>
            {(_, i) => (
              <button
                type="button"
                role="tab"
                aria-selected={active() === i()}
                aria-label={`Go to slide ${i() + 1}`}
                class={`h-[7px] cursor-pointer rounded-full transition-[width,background] duration-[250ms] ${
                  active() === i() ? 'w-5 bg-white' : 'w-[7px] bg-white/30'
                }`}
                onClick={() => setFocus(i(), true)}
              />
            )}
          </For>
        </div>
      )}
    </div>
  );
};

export default DepthCarousel;
