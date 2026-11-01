import { createEffect, onCleanup, Show, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  children?: JSX.Element;
  class?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

const ScrollExpand = (props: ScrollExpandProps) => {
  const [local, rest] = splitProps(props, [
    'src',
    'mediaType',
    'poster',
    'alt',
    'title',
    'scrollHint',
    'startWidth',
    'startHeight',
    'startRadius',
    'endRadius',
    'mediaZoom',
    'scrollDistance',
    'holdDistance',
    'smoothing',
    'overlayScrim',
    'useWindowScroll',
    'enabled',
    'children',
    'class',
    'className',
    'style'
  ]);

  let rootRef!: HTMLDivElement;
  let trackRef!: HTMLDivElement;
  let stageRef!: HTMLDivElement;
  let frameRef!: HTMLDivElement;
  let mediaRef!: HTMLImageElement | HTMLVideoElement;
  let titleRef!: HTMLDivElement | undefined;
  let overlayRef!: HTMLDivElement | undefined;
  let scrimRef!: HTMLDivElement | undefined;
  let hintRef!: HTMLDivElement | undefined;

  // Non-reactive config mirror refreshed by a tracked effect — the scroll
  // engine reads latest config lazily, exactly like upstream's propsRef.
  let cfg = {
    startWidth: 42,
    startHeight: 58,
    startRadius: 24,
    endRadius: 0,
    mediaZoom: 1.35,
    scrollDistance: 1.2,
    holdDistance: 0.35,
    smoothing: 0.1,
    overlayScrim: 0.45,
    useWindowScroll: false,
    enabled: true
  };

  createEffect(() => {
    cfg = {
      startWidth: local.startWidth ?? 42,
      startHeight: local.startHeight ?? 58,
      startRadius: local.startRadius ?? 24,
      endRadius: local.endRadius ?? 0,
      mediaZoom: local.mediaZoom ?? 1.35,
      scrollDistance: local.scrollDistance ?? 1.2,
      holdDistance: local.holdDistance ?? 0.35,
      smoothing: local.smoothing ?? 0.1,
      overlayScrim: local.overlayScrim ?? 0.45,
      useWindowScroll: local.useWindowScroll ?? false,
      enabled: local.enabled ?? true
    };
  });

  const applyProgress = (p: number) => {
    const frame = frameRef;
    const media = mediaRef;
    if (!frame || !media) return;
    const c = cfg;

    const e = smoothstep(0, 1, p);

    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (scrimRef) scrimRef.style.opacity = `${c.overlayScrim * e}`;

    if (titleRef) {
      const out = smoothstep(0.4, 0.88, p);
      titleRef.style.opacity = `${1 - out}`;
      titleRef.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }

    if (hintRef) {
      const gone = smoothstep(0, 0.12, p);
      hintRef.style.opacity = `${1 - gone}`;
      hintRef.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    if (overlayRef) {
      const inn = smoothstep(0.68, 1, p);
      overlayRef.style.opacity = `${inn}`;
      overlayRef.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  };

  // Engine re-inits when the scroller mode changes, like upstream's
  // [applyProgress, useWindowScroll] dep array.
  createEffect(() => {
    const useWindowScroll = local.useWindowScroll ?? false;
    void useWindowScroll;

    const root = rootRef;
    const track = trackRef;
    const stage = stageRef;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      const c = cfg;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 20, 84)}px`);
    };

    const readProgress = () => {
      const c = cfg;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = cfg;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (cfg.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    const scroller: Window | HTMLDivElement = cfg.useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    onCleanup(() => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    });
  });

  return (
    <div
      ref={rootRef}
      {...rest}
      class={`relative h-full w-full ${local.useWindowScroll ? '' : 'overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'} ${local.class ?? ''} ${local.className ?? ''}`.trim()}
      style={local.style}
    >
      <div ref={trackRef} class="relative w-full">
        <div ref={stageRef} class="sticky top-0 w-full overflow-hidden [--se-title-size:4rem]">
          <div
            ref={frameRef}
            class="absolute inset-0 [clip-path:inset(21%_29%_21%_29%_round_24px)] [will-change:clip-path]"
          >
            <Show
              when={local.mediaType === 'video'}
              fallback={
                <img
                  ref={mediaRef as HTMLImageElement}
                  class="absolute inset-0 h-full w-full origin-center object-cover select-none [will-change:transform]"
                  src={local.src}
                  alt={local.alt ?? ''}
                  draggable={false}
                />
              }
            >
              <video
                ref={mediaRef as HTMLVideoElement}                class="absolute inset-0 h-full w-full origin-center object-cover select-none [will-change:transform]"
                src={local.src}
                poster={local.poster}
                autoplay
                muted
                loop
                playsinline
              />
            </Show>
            <div
              ref={el => {
                scrimRef = el;
              }}
              class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.75),rgba(0,0,0,0.1)_45%,rgba(0,0,0,0.35))] opacity-0"
            />
            <Show when={local.children}>
              <div
                ref={el => {
                  overlayRef = el;
                }}
                class="absolute inset-0 flex flex-col items-center justify-center p-[6%] text-center opacity-0 [will-change:opacity,transform]"
              >
                {local.children}
              </div>
            </Show>
          </div>
          <Show when={local.title}>
            <div
              ref={el => {
                titleRef = el;
              }}
              class="pointer-events-none absolute inset-0 m-0 flex items-center justify-center px-[6%] text-center font-bold leading-none tracking-[-0.03em] text-white [font-size:var(--se-title-size)] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)] [will-change:opacity,transform]"
            >
              {local.title}
            </div>
          </Show>
          <Show when={local.scrollHint}>
            <div
              ref={el => {
                hintRef = el;
              }}
              class="pointer-events-none absolute inset-x-0 bottom-5 text-center text-[0.8125rem] tracking-[0.02em] text-white/55 [will-change:opacity,transform]"
            >
              {local.scrollHint}
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;
