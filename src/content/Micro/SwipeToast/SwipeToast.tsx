import { createEffect, createSignal, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import HugeiconsIcon from '@/lib/HugeiconsIcon';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

export type SwipeToastCloseReason = 'timeout' | 'swipe' | 'action' | 'close' | 'escape' | 'programmatic';
export type SwipeToastFuse = 'bottom' | 'top' | 'none';
export type SwipeToastPhase = 'open' | 'closing' | 'gone';

export interface SwipeToastProps {
  title?: JSX.Element;
  description?: JSX.Element;
  icon?: JSX.Element;
  actionLabel?: JSX.Element;
  onAction?: () => void;
  open?: boolean;
  onClose?: (reason: SwipeToastCloseReason) => void;
  background?: string;
  color?: string;
  fuseColor?: string;
  width?: number;
  radius?: number;
  slideMs?: number;
  settleBounce?: number;
  swipeDistance?: number;
  duration?: number;
  fuse?: SwipeToastFuse;
  pauseOnHover?: boolean;
  closeButton?: boolean;
  inline?: boolean;
  dismissible?: boolean;
  className?: string;
  class?: string;
}

type Sample = [number, number];

interface Drag {
  id: number;
  startY: number;
  grab: number | null;
  moved: boolean;
  hist: Sample[];
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const FLICK = 0.11;
const DEAD_ZONE = 3;
const RESIST_PX = 24;
const COLLAPSE_MS = 200;
const EXIT = 0.7;
const BURN = [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }];
const HAS_STARTING_STYLE = typeof window !== 'undefined' && 'CSSStartingStyleRule' in window;

const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0;
  const [t0, y0] = hist[0];
  const [t1, y1] = hist[hist.length - 1];
  return performance.now() - t1 > 100 ? 0 : (y1 - y0) / Math.max(1, t1 - t0);
};

const SwipeToast = (props: SwipeToastProps) => {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = createSignal<SwipeToastPhase>('open');
  const [instant, setInstant] = createSignal(false);
  const [mounted, setMounted] = createSignal(HAS_STARTING_STYLE);
  let cardEl!: HTMLDivElement;
  let fuseEl!: HTMLElement;
  let anim: Animation | null = null;
  let drag: Drag | null = null;
  const flags = { hover: false, interacting: false, focus: false, hidden: false };
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  let pendingClose: SwipeToastCloseReason | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let leaving = false;

  const y = motionValue(0);
  const fade = motionValue(1);

  const slideMs = () => props.slideMs ?? 400;
  const inline = () => props.inline ?? false;

  const syncFuse = () => {
    const a = anim;
    if (!a) return;
    if (flags.hover || flags.interacting || flags.focus || flags.hidden) a.pause();
    else if (a.playState === 'paused') a.play();
  };
  const finish = (why: SwipeToastCloseReason) => {
    setPhase('gone');
    leaving = false;
    if (untrack(inline)) closeTimer = setTimeout(() => untrack(() => props.onClose?.(why)), COLLAPSE_MS);
    else untrack(() => props.onClose?.(why));
  };
  const close = (why: SwipeToastCloseReason) => {
    if (phase() !== 'open' || leaving) return;
    if (drag) {
      pendingClose = why;
      return;
    }
    anim?.pause();
    const now = why === 'escape' || ((why === 'action' || why === 'close') && lastInput === 'keyboard');
    setInstant(now);
    setPhase('closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => finish(why), now ? 0 : slideMs() * EXIT + 60);
  };
  const rescue = () => {
    clearTimeout(closeTimer);
    setInstant(false);
    y.set(0);
    fade.set(1);
    setPhase('open');
  };

  createEffect(() => {
    const open = props.open ?? true;
    // Upstream ran this on [open] only; phase is read untracked for the same
    // semantics (re-entering 'open' phase must not trigger rescue()).
    untrack(() => {
      if (!open) close('programmatic');
      else if (phase() !== 'open') rescue();
    });
  });

  onMount(() => {
    if (HAS_STARTING_STYLE) return;
    const raf = requestAnimationFrame(() => setMounted(true));
    onCleanup(() => cancelAnimationFrame(raf));
  });

  createEffect(() => {
    const ph = phase();
    const dur = props.duration ?? 4000;
    if (ph !== 'open' || dur <= 0 || !fuseEl) return;
    anim?.cancel();
    const a = fuseEl.animate(BURN, { duration: dur, easing: 'linear', fill: 'forwards' });
    a.onfinish = () => close('timeout');
    anim = a;
    syncFuse();
    onCleanup(() => {
      a.onfinish = null;
      a.pause();
    });
  });

  createEffect(() => {
    if (!(props.pauseOnHover ?? true)) {
      flags.hover = false;
      syncFuse();
    }
  });

  onMount(() => {
    const onVisibility = () => {
      flags.hidden = document.hidden;
      syncFuse();
    };
    document.addEventListener('visibilitychange', onVisibility);
    onCleanup(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(closeTimer);
      anim?.cancel();
      y.stop();
      fade.stop();
    });
  });

  const swipeOut = (dy: number, v: number) => {
    anim?.pause();
    leaving = true;
    pendingClose = null;
    if (!reduce() && cardEl) {
      animate(y, dy + cardEl.offsetHeight, { type: 'spring', duration: 0.3, bounce: 0, velocity: v * 1000 });
    }
    const fadeOut = animate(fade, 0, { duration: 0.2, ease: EASE_OUT });
    onCleanup(() => fadeOut.stop());
    fadeOut.then(() => finish('swipe'));
  };
  const onPointerDown = (e: PointerEvent) => {
    lastInput = 'pointer';
    const el = e.currentTarget as HTMLDivElement;
    if (
      e.button !== 0 ||
      !(props.dismissible ?? true) ||
      drag ||
      leaving ||
      (e.target as HTMLElement).closest('button')
    )
      return;
    if (phase() === 'closing') rescue();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    y.stop();
    drag = {
      id: e.pointerId,
      startY: e.clientY,
      grab: null,
      moved: false,
      hist: [[performance.now(), y.get()]]
    };
    flags.interacting = true;
    syncFuse();
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag;
    if (!d || d.id !== e.pointerId) return;
    if (d.grab === null) {
      if (Math.abs(e.clientY - d.startY) < DEAD_ZONE) return;
      d.grab = e.clientY - y.get();
      if (cardEl) cardEl.dataset.swiping = '';
    }
    const raw = e.clientY - d.grab;
    const next = raw >= 0 ? raw : rubberband(raw, RESIST_PX);
    y.set(next);
    d.moved = true;
    d.hist.push([performance.now(), next]);
    if (d.hist.length > 4) d.hist.shift();
  };
  const onPointerUp = (e: PointerEvent) => {
    const d = drag;
    if (!d || d.id !== e.pointerId) return;
    drag = null;
    if (cardEl) delete cardEl.dataset.swiping;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
    flags.interacting = false;
    const dy = y.get();
    const v = velocityOf(d.hist);
    if (dy > 0 && (v > FLICK || (dy >= (props.swipeDistance ?? 40) && v >= 0))) {
      swipeOut(dy, v);
      return;
    }
    if (d.moved) {
      const back0 = animate(
        y,
        0,
        reduce()
          ? { duration: 0.2, ease: EASE_OUT }
          : { type: 'spring', duration: 0.5, bounce: props.settleBounce ?? 0.2, velocity: v * 1000 }
      );
      onCleanup(() => back0.stop());
    }
    const queued = pendingClose;
    pendingClose = null;
    if (queued) close(queued);
    else syncFuse();
  };

  return (
    <div
      class={`group grid w-[min(var(--st-w),100%)] text-[13px] leading-normal [grid-template-rows:1fr] [color:var(--st-ink)] data-[inline=false]:fixed data-[inline=false]:right-8 data-[inline=false]:bottom-[calc(32px+env(safe-area-inset-bottom,0px))] data-[inline=false]:z-[999999999] data-[inline=false]:w-[min(var(--st-w),calc(100vw-64px))] max-[600px]:data-[inline=false]:right-4 max-[600px]:data-[inline=false]:bottom-[calc(16px+env(safe-area-inset-bottom,0px))] max-[600px]:data-[inline=false]:w-[min(var(--st-w),calc(100vw-32px))] data-[inline=true]:[transition:grid-template-rows_var(--st-slide)_cubic-bezier(0.23,1,0.32,1)] data-[inline=true]:starting:[grid-template-rows:0fr] data-[inline=true]:data-[mounted=false]:[grid-template-rows:0fr] data-[inline=true]:data-[phase=closing]:[grid-template-rows:0fr] data-[inline=true]:data-[phase=gone]:[grid-template-rows:0fr] data-[inline=true]:data-[phase=closing]:[transition-duration:calc(var(--st-slide)*0.7)] data-[inline=true]:data-[phase=gone]:[transition-duration:200ms]${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      data-phase={phase()}
      data-inline={inline() ? 'true' : 'false'}
      data-fuse={(props.duration ?? 4000) > 0 ? (props.fuse ?? 'bottom') : 'none'}
      data-dismissible={(props.dismissible ?? true) ? 'true' : 'false'}
      data-instant={instant() ? '' : undefined}
      data-mounted={mounted() ? 'true' : 'false'}
      style={{
        '--st-bg': props.background ?? '#27272a',
        '--st-ink': props.color ?? '#f5f5f5',
        '--st-fuse': props.fuseColor ?? '#f5a524',
        '--st-w': `${props.width ?? 356}px`,
        '--st-radius': `${props.radius ?? 12}px`,
        '--st-slide': `${slideMs()}ms`,
        '--st-gap': '10px'
      }}
    >
      <div class="min-h-0">
        <div class="opacity-100 group-data-[inline=true]:mt-[var(--st-gap)] [transform:translateY(0)] [transition:transform_var(--st-slide)_cubic-bezier(0.23,1,0.32,1),opacity_calc(var(--st-slide)*0.6)_ease] starting:opacity-0 starting:[transform:translateY(100%)] group-data-[mounted=false]:opacity-0 group-data-[mounted=false]:[transform:translateY(100%)] group-data-[phase=closing]:opacity-0 group-data-[phase=closing]:[transform:translateY(100%)] group-data-[phase=closing]:[transition:transform_calc(var(--st-slide)*0.7)_cubic-bezier(0.23,1,0.32,1),opacity_calc(var(--st-slide)*0.5)_ease] group-data-[phase=gone]:invisible group-data-[phase=gone]:opacity-0 group-data-[phase=gone]:[transform:translateY(100%)] group-data-[instant]:[transition-duration:0s] motion-reduce:[transform:none]! motion-reduce:[transition:opacity_200ms_ease]">
          <div
            ref={cardEl}
            class="relative flex cursor-grab touch-none items-center gap-2 overflow-hidden p-4 outline-none select-none shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.1)] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [background:var(--st-bg)] [border-radius:var(--st-radius)] data-[swiping]:cursor-grabbing group-data-[dismissible=false]:cursor-default group-data-[dismissible=false]:touch-auto"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerEnter={e => {
              if ((props.pauseOnHover ?? true) && e.pointerType === 'mouse') {
                flags.hover = true;
                syncFuse();
              }
            }}
            onPointerLeave={e => {
              if (e.pointerType === 'mouse') {
                flags.hover = false;
                syncFuse();
              }
            }}
            onFocus={() => {
              flags.focus = true;
              syncFuse();
            }}
            onBlur={e => {
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) {
                flags.focus = false;
                syncFuse();
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard';
              if (e.key === 'Escape' && (props.dismissible ?? true)) {
                e.stopPropagation();
                close('escape');
              }
            }}
          >
            {props.icon ? (
              <span class="inline-flex h-[18px] w-[18px] flex-none [&_svg]:h-full [&_svg]:w-full" aria-hidden="true">
                {props.icon}
              </span>
            ) : null}
            <span class="flex min-w-0 flex-auto flex-col gap-px">
              <span class="leading-normal font-medium">{props.title ?? 'File archived'}</span>
              {props.description ? (
                <span class="leading-[1.4] font-normal [color:color-mix(in_srgb,var(--st-ink)_66%,transparent)]">
                  {props.description}
                </span>
              ) : null}
            </span>
            {props.actionLabel ? (
              <button
                type="button"
                class="h-6 flex-none cursor-pointer touch-manipulation rounded-[5px] border-0 px-2 text-xs font-medium outline-none [-webkit-tap-highlight-color:transparent] [background:var(--st-ink)] [color:var(--st-bg)] [font-family:inherit] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1),opacity_160ms_ease] active:[transform:scale(0.97)] motion-reduce:active:[transform:none] [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-[0.88]"
                onClick={() => {
                  untrack(() => props.onAction?.());
                  close('action');
                }}
              >
                {props.actionLabel}
              </button>
            ) : null}
            {props.closeButton ? (
              <button
                type="button"
                class="relative grid h-6 w-6 flex-none cursor-pointer touch-manipulation place-items-center rounded-[5px] border-0 bg-transparent text-inherit outline-none [-webkit-tap-highlight-color:transparent] [font-family:inherit] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1),background-color_160ms_ease] before:absolute before:-inset-2 before:content-[''] active:[transform:scale(0.97)] motion-reduce:active:[transform:none] [@media(hover:hover)_and_(pointer:fine)]:hover:[background:color-mix(in_srgb,var(--st-ink)_10%,transparent)]"
                aria-label="Close"
                onClick={() => close('close')}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2.5} />
              </button>
            ) : null}
            <i
              ref={fuseEl}
              class="pointer-events-none absolute right-0 bottom-0 left-0 h-0.5 origin-left [background:linear-gradient(90deg,transparent_0%,color-mix(in_srgb,var(--st-fuse)_18%,transparent)_9%,color-mix(in_srgb,var(--st-fuse)_50%,transparent)_18%,color-mix(in_srgb,var(--st-fuse)_84%,transparent)_28%,var(--st-fuse)_38%,var(--st-fuse)_62%,color-mix(in_srgb,var(--st-fuse)_84%,transparent)_72%,color-mix(in_srgb,var(--st-fuse)_50%,transparent)_82%,color-mix(in_srgb,var(--st-fuse)_18%,transparent)_91%,transparent_100%)] group-data-[fuse=top]:top-0 group-data-[fuse=top]:bottom-auto group-data-[fuse=none]:opacity-0"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeToast;
