import { createEffect, createSignal, createUniqueId, For, onCleanup, onMount, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import type { AnimationPlaybackControls } from 'motion';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';
import HugeiconsIcon from '@/lib/HugeiconsIcon';
import { Delete02Icon } from '@hugeicons/core-free-icons';

const HYST = 10;
const FLICK = 110;
const DECEL = 0.998;
const VMAX = 1500;
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const DEFAULT_ACTIONS: SwipeAction[] = [{ id: 'delete', label: 'Delete' }];

export interface SwipeAction {
  id: string;
  label: string;
  icon?: JSX.Element;
  color?: string;
  dismiss?: boolean;
  onSelect?: () => void;
}

export interface SwipeRowProps {
  children?: JSX.Element;
  actions?: SwipeAction[];
  actionColor?: string;
  drawerColor?: string;
  rowColor?: string;
  textColor?: string;
  height?: number;
  radius?: number;
  actionWidth?: number;
  direction?: 'left' | 'right';
  snapBounce?: number;
  resistance?: number;
  collapseMs?: number;
  commitAt?: number;
  fullSwipe?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction?: (action: SwipeAction) => void;
  onCommit?: (action: SwipeAction) => void;
  closeOnAction?: boolean;
  haptic?: boolean;
  label?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

type Sample = [number, number];
type Phase = 'idle' | 'committing' | 'collapsing';

interface Grip {
  id: number;
  x0: number;
  y0: number;
  grab: number | null;
  moved: boolean;
  hist: Sample[];
  touch: boolean;
}

interface Live {
  move: (e: PointerEvent) => void;
  up: (e: PointerEvent) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rubber = (o: number, dim: number, c: number) => (o * dim * c) / (dim + c * Math.abs(o));
const unrubber = (y: number, dim: number, c: number) => (y * dim) / (c * Math.max(1, dim - Math.abs(y)));
const project = (v: number) => ((v / 1000) * DECEL) / (1 - DECEL);
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0;
  const a = hist[0];
  const b = hist[hist.length - 1];
  return ((b[1] - a[1]) / Math.max(1, b[0] - a[0])) * 1000;
};
const onColor = (hex: string) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  const h = m[1].length === 3 ? [...m[1]].map(ch => ch + ch).join('') : m[1];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#111111' : '#ffffff';
};
const watchWindow = (live: { current: Live }) => {
  const onMove = (e: PointerEvent) => {
    if (e.isTrusted) live.current.move(e);
  };
  const onUp = (e: PointerEvent) => {
    if (e.isTrusted) live.current.up(e);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
};

const SwipeRow = (props: SwipeRowProps) => {
  const actions = () => props.actions ?? DEFAULT_ACTIONS;
  const uid = createUniqueId();
  const reduce = usePrefersReducedMotion();
  const s = () => (props.direction === 'left' ? -1 : 1);
  const A = () => props.actionWidth ?? 80;
  const n = () => actions().length;
  const D = () => n() * A();
  const c = () => clamp(props.resistance ?? 0.55, 0.05, 1);
  const primary = () => actions()[0];
  const [openState, setOpenState] = createSignal(false);
  const [phase, setPhase] = createSignal<Phase>('idle');
  const [say, setSay] = createSignal('');
  const open = () => props.open ?? openState();

  let rootEl!: HTMLDivElement;
  let surfaceEl: HTMLDivElement | null = null;
  let railEl: HTMLDivElement | null = null;
  let blockEl: HTMLDivElement | null = null;
  let glyphEl: HTMLButtonElement | null = null;
  let w = 360;
  let grip: Grip | null = null;
  let unwatch: (() => void) | null = null;
  const live: { current: Live } = { current: {} as Live };
  let foldTimer: ReturnType<typeof setTimeout> | undefined;
  let heading: number | null = null;
  let paintRaf = 0;
  let anims: AnimationPlaybackControls[] = [];

  const x = motionValue(0);
  const spread = motionValue(0);
  const landed = motionValue(0);

  const track = (controls: AnimationPlaybackControls) => {
    anims.push(controls);
    void controls.then(() => {
      anims = anims.filter(a => a !== controls);
    });
    return controls;
  };

  const commitPoint = () => Math.max((props.commitAt ?? 0.6) * w, D() + A() / 2);
  const canCommit = () => (props.fullSwipe ?? true) && n() > 0 && commitPoint() <= w;
  // Upstream derived transforms (exposed/surfaceXf/railXf/shift/blockXf/glyphXf)
  // collapse into one imperative paint subscribed to the three motion values.
  const paint = () => {
    paintRaf = 0;
    const e = s() * x.get();
    const p = spread.get();
    const l = landed.get();
    if (surfaceEl) surfaceEl.style.transform = `translateX(${x.get()}px)`;
    if (railEl) railEl.style.transform = `translateX(${-s() * Math.max(0, D() - e)}px)`;
    const shift = p * Math.max(0, e - A());
    if (blockEl) blockEl.style.transform = `translateX(${s() * shift}px)`;
    if (glyphEl) glyphEl.style.transform = `translateX(${-s() * l * (shift - (w - A()) / 2)}px)`;
  };
  const schedulePaint = () => {
    if (paintRaf) return;
    paintRaf = requestAnimationFrame(paint);
  };

  const map = (raw: number) => {
    const W = w;
    if (raw < 0) return rubber(raw, W, c());
    if (raw <= D()) return raw;
    if (!canCommit()) return D() + rubber(raw - D(), W, c());
    const C = commitPoint();
    const knee = D() + (C - D()) / c();
    return raw <= knee ? D() + c() * (raw - D()) : C + rubber(raw - knee, W, c());
  };
  const inv = (ex: number) => {
    const W = w;
    if (ex < 0) return unrubber(ex, W, c());
    if (ex <= D()) return ex;
    if (!canCommit()) return D() + unrubber(ex - D(), W, c());
    const C = commitPoint();
    const knee = D() + (C - D()) / c();
    return ex <= C ? D() + (ex - D()) / c() : knee + unrubber(ex - C, W, c());
  };

  onMount(() => {
    const el = rootEl;
    w = el.offsetWidth || w;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) w = width;
    });
    observer.observe(el);
    const offs = [x.on('change', schedulePaint), spread.on('change', schedulePaint), landed.on('change', schedulePaint)];
    paint();
    onCleanup(() => {
      observer.disconnect();
      offs.forEach(off => off());
      cancelAnimationFrame(paintRaf);
      anims.forEach(a => a.stop());
      unwatch?.();
    });
  });
  onCleanup(() => {
    clearTimeout(foldTimer);
  });

  const setOpen = (next: boolean) => {
    if (next === open()) return;
    setOpenState(next);
    props.onOpenChange?.(next);
  };
  const settle = (target: number, v = 0) => {
    heading = target;
    if (reduce()) {
      track(animate(x, s() * target, { duration: 0.2, ease: EASE_OUT }));
      return;
    }
    const flick = Math.abs(v) >= FLICK;
    const snapBounce = props.snapBounce ?? 0.2;
    track(
      animate(
        x,
        s() * target,
        flick
          ? { type: 'spring', duration: 0.4, bounce: snapBounce, velocity: s() * clamp(v, -VMAX, VMAX) }
          : { ...SPRING_UI, velocity: s() * v }
      )
    );
  };
  const setSpread = (onNow: boolean) => {
    if ((spread.get() === 1) === onNow) return;
    if (reduce()) spread.set(onNow ? 1 : 0);
    else track(animate(spread, onNow ? 1 : 0, SPRING_UI));
    if (onNow && primary()) {
      setSay(`Release to ${primary()!.label}`);
      if ((props.haptic ?? true) && grip?.touch) navigator.vibrate?.(8);
    }
  };
  const commit = (a: SwipeAction, viaKey: boolean, v = 0) => {
    const leap = a === primary();
    setPhase('committing');
    setSay(a.label);
    setOpen(false);
    const collapseMs = props.collapseMs ?? 200;
    const fold = () => {
      setPhase('collapsing');
      foldTimer = setTimeout(() => {
        props.onCommit?.(a);
        a.onSelect?.();
      }, collapseMs);
    };
    if (viaKey || reduce()) {
      if (leap) {
        spread.set(1);
        landed.set(1);
      }
      if (viaKey) {
        x.set(s() * w);
        fold();
      } else track(animate(x, s() * w, { duration: 0.2, ease: EASE_OUT })).then(fold);
      return;
    }
    if (leap) {
      if (spread.get() < 1) track(animate(spread, 1, SPRING_UI));
      track(animate(landed, 1, SPRING_UI));
    }
    track(animate(x, s() * w, { ...SPRING_UI, velocity: s() * v })).then(fold);
  };
  createEffect(() => {
    // Upstream deps: [open, D]
    const openProp = props.open;
    open();
    D();
    if (openProp === undefined || grip || phase() !== 'idle') return;
    const target = open() ? D() : 0;
    if (heading === target) return;
    if (Math.abs(s() * x.get() - target) > 0.5) settle(target);
  });

  const down = (e: PointerEvent) => {
    if (props.disabled || n() === 0 || phase() !== 'idle' || grip || e.button !== 0) return;
    x.stop();
    heading = null;
    grip = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      grab: null,
      moved: false,
      hist: [],
      touch: e.pointerType === 'touch'
    };
    try {
      surfaceEl?.setPointerCapture(e.pointerId);
    } catch {}
    unwatch?.();
    unwatch = watchWindow(live);
  };
  const move = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    if (g.grab === null) {
      const dx = e.clientX - g.x0;
      const dy = e.clientY - g.y0;
      if (Math.abs(dx) < HYST || Math.abs(dx) < Math.abs(dy)) return;
      g.grab = s() * (g.x0 + Math.sign(dx) * HYST) - inv(s() * x.get());
      g.moved = true;
      rootEl?.setAttribute('data-dragging', '');
    }
    const ex = map(s() * e.clientX - g.grab);
    x.set(s() * ex);
    g.hist.push([performance.now(), ex]);
    if (g.hist.length > 4) g.hist.shift();
    setSpread(canCommit() && ex >= commitPoint());
  };
  const up = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    unwatch?.();
    unwatch = null;
    rootEl?.removeAttribute('data-dragging');
    try {
      surfaceEl?.releasePointerCapture(e.pointerId);
    } catch {}
    const ex = s() * x.get();
    const v = velocityOf(g.hist);
    if (!g.moved) {
      if (open()) {
        setOpen(false);
        settle(0);
      }
      return;
    }
    if (primary() && canCommit() && ex >= commitPoint()) {
      commit(primary()!, false, v);
      return;
    }
    const target = Math.abs(v) >= FLICK ? (v > 0 ? D() : 0) : ex + project(v) > D() / 2 ? D() : 0;
    setSpread(false);
    setOpen(target === D());
    settle(target, v);
  };
  live.current = { move, up };

  const act = (a: SwipeAction, e: MouseEvent) => {
    if (phase() !== 'idle') return;
    props.onAction?.(a);
    if (a === primary() || a.dismiss) {
      commit(a, e.detail === 0);
      return;
    }
    a.onSelect?.();
    if (props.closeOnAction !== false) return;
    setOpen(false);
    if (e.detail === 0) {
      heading = 0;
      x.set(0);
    } else settle(0);
  };
  const openNow = () => {
    heading = D();
    x.set(s() * D());
    setOpen(true);
    setSay(`${n()} actions revealed`);
  };
  const closeNow = () => {
    heading = 0;
    x.set(0);
    setOpen(false);
  };
  const onToggleKey = (e: KeyboardEvent) => {
    if (props.disabled || phase() !== 'idle' || n() === 0) return;
    const openKey = s() < 0 ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = s() < 0 ? 'ArrowRight' : 'ArrowLeft';
    const toggle = e.key === 'Enter' || e.key === ' ';
    if (e.key === openKey || (toggle && !open())) {
      e.preventDefault();
      openNow();
    } else if (e.key === closeKey || e.key === 'Escape' || (toggle && open())) {
      e.preventDefault();
      closeNow();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && open() && primary() && canCommit()) {
      e.preventDefault();
      commit(primary()!, true);
    }
  };
  const onToggleClick = (e: MouseEvent) => {
    if (e.detail !== 0 || props.disabled || phase() !== 'idle' || n() === 0) return;
    if (open()) closeNow();
    else openNow();
  };

  const railId = `${uid}-rail`;
  const direction = () => props.direction ?? 'left';

  return (
    <div
      ref={rootEl}
      role="group"
      aria-label={props.label ?? 'List item'}
      class={`group relative overflow-hidden [height:var(--sr-h)] [transition:height_var(--sr-collapse)_cubic-bezier(0.23,1,0.32,1),margin-bottom_var(--sr-collapse)_cubic-bezier(0.23,1,0.32,1),opacity_var(--sr-collapse)_cubic-bezier(0.23,1,0.32,1)] data-[phase=collapsing]:h-0! data-[phase=collapsing]:mb-0! data-[phase=collapsing]:opacity-0 data-[disabled]:pointer-events-none data-[disabled]:opacity-55${props.className ? ` ${props.className}` : ''}`}
      data-direction={direction()}
      data-open={open() ? '' : undefined}
      data-phase={phase()}
      data-disabled={props.disabled ? '' : undefined}
      style={
        {
          '--sr-h': `${props.height ?? 64}px`,
          '--sr-r': `${props.radius ?? 16}px`,
          '--sr-a': `${A()}px`,
          '--sr-row': props.rowColor ?? '#27272a',
          '--sr-text': props.textColor ?? '#f5f5f5',
          '--sr-drawer': props.drawerColor ?? '#3f3f46',
          '--sr-on-drawer': onColor(props.drawerColor ?? '#3f3f46'),
          '--sr-action': props.actionColor ?? '#e5484d',
          '--sr-on-action': onColor(props.actionColor ?? '#e5484d'),
          '--sr-collapse': `${props.collapseMs ?? 200}ms`,
          ...props.style
        } as JSX.CSSProperties
      }
    >
      <div class="relative overflow-hidden [height:var(--sr-h)] [border-radius:var(--sr-r)] [background:var(--sr-row)]">
        <div
          ref={el => {
            railEl = el;
          }}
          id={railId}
          class="absolute inset-0 [background:var(--sr-drawer)]"
          inert={!open()}
          aria-hidden={!open()}
        >
          <For each={actions().slice(1)}>
            {(a, i) => (
              <button
                type="button"
                class="group/action absolute top-0 grid h-full cursor-pointer touch-manipulation place-items-center border-0 p-0 [font:inherit] outline-none select-none [width:var(--sr-a)] [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] after:pointer-events-none after:absolute after:inset-0 after:bg-white after:opacity-0 after:content-[''] [@media(hover:hover)_and_(pointer:fine)]:after:[transition:opacity_150ms_ease] [@media(hover:hover)_and_(pointer:fine)]:hover:after:opacity-[0.08]"
                onClick={e => act(a, e)}
                style={
                  s() < 0
                    ? { right: `${(i() + 1) * A()}px`, background: a.color ?? props.drawerColor ?? '#3f3f46', color: onColor(a.color ?? props.drawerColor ?? '#3f3f46') }
                    : { left: `${(i() + 1) * A()}px`, background: a.color ?? props.drawerColor ?? '#3f3f46', color: onColor(a.color ?? props.drawerColor ?? '#3f3f46') }
                }
              >
                <span class="grid justify-items-center gap-1 text-[11px] leading-none font-medium tracking-[0.01em] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] group-active/action:scale-[0.97] motion-reduce:group-active/action:scale-100">
                  {a.icon ? <span class="inline-flex">{a.icon}</span> : null}
                  <span>{a.label}</span>
                </span>
              </button>
            )}
          </For>
          {primary() ? (
            <div
              ref={el => {
                blockEl = el;
              }}
              class="absolute top-0 h-full w-full [background:var(--sr-action)] group-data-[direction=left]:[left:calc(100%-var(--sr-a))] group-data-[direction=right]:[right:calc(100%-var(--sr-a))]"
            >
              <button
                ref={el => {
                  glyphEl = el;
                }}
                type="button"
                class="group/action absolute top-0 grid h-full cursor-pointer touch-manipulation place-items-center border-0 bg-transparent p-0 [font:inherit] outline-none select-none [width:var(--sr-a)] [color:var(--sr-on-action)] [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] group-data-[direction=left]:left-0 group-data-[direction=right]:right-0 after:pointer-events-none after:absolute after:inset-0 after:bg-white after:opacity-0 after:content-[''] [@media(hover:hover)_and_(pointer:fine)]:after:[transition:opacity_150ms_ease] [@media(hover:hover)_and_(pointer:fine)]:hover:after:opacity-[0.08]"
                onClick={e => act(primary()!, e)}
              >
                <span class="grid justify-items-center gap-1 text-[11px] leading-none font-medium tracking-[0.01em] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] group-active/action:scale-[0.97] motion-reduce:group-active/action:scale-100">
                  <span class="inline-flex">
                    {primary()!.icon ?? <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={2} />}
                  </span>
                  <span>{primary()!.label}</span>
                </span>
              </button>
            </div>
          ) : null}
        </div>
        <div
          ref={el => {
            surfaceEl = el;
          }}
          class="relative z-[1] flex h-full touch-pan-y items-center gap-3 px-4 [background:var(--sr-row)] [color:var(--sr-text)] [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] [@media(hover:hover)_and_(pointer:fine)]:cursor-grab [@media(hover:hover)_and_(pointer:fine)]:group-data-[dragging]:cursor-grabbing [@media(pointer:coarse)]:select-none group-data-[dragging]:select-none group-data-[dragging]:[&_*]:select-none"
          onPointerDown={down}
        >
          {props.children}
          <button
            type="button"
            class="absolute top-1/2 m-0 h-px w-px overflow-hidden border-0 bg-transparent p-0 [font:inherit] outline-none [clip-path:inset(50%)] [color:var(--sr-text)] group-data-[direction=left]:right-3 group-data-[direction=right]:left-3 focus-visible:h-6 focus-visible:w-auto focus-visible:-translate-y-1/2 focus-visible:overflow-visible focus-visible:rounded-xl focus-visible:px-2.5 focus-visible:text-xs focus-visible:whitespace-nowrap focus-visible:[clip-path:none] focus-visible:[background:color-mix(in_srgb,var(--sr-text)_12%,transparent)]"
            tabIndex={props.disabled ? -1 : 0}
            aria-expanded={open()}
            aria-controls={railId}
            aria-keyshortcuts={s() < 0 ? 'ArrowLeft' : 'ArrowRight'}
            onKeyDown={onToggleKey}
            onClick={onToggleClick}
          >
            {n()} {n() === 1 ? 'action' : 'actions'}
          </button>
        </div>
      </div>
      <span class="sr-only" aria-live="polite">
        {say()}
      </span>
    </div>
  );
};

export default SwipeRow;
