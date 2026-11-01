import { createEffect, createSignal, createUniqueId, onCleanup, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

export interface SquishSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  trackColor?: string;
  trackOnColor?: string;
  thumbColor?: string;
  thumbOnColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  speed?: number;
  stretch?: number;
  hoverScale?: number;
  colorDuration?: number;
  ariaLabel?: string;
  className?: string;
  id?: string;
}

interface Grip {
  id: number;
  grab: number | null;
  moved: boolean;
  startX: number;
  onAtPress: boolean;
  slop: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const FLOW_SPRING = { stiffness: 320, damping: 40, mass: 0.6 };
const SWELL_SPRING = { stiffness: 520, damping: 34, mass: 0.6 };
const MAX_STRETCH = 0.4;
const STRETCH_SPEED = 600;
const TAP_SLOP = { fine: 4, coarse: 8 };

// Vanilla replacement for useSpring(source, cfg): a rAF spring that chases a
// numeric target. Semi-implicit Euler matches motion's spring feel closely.
const trackingSpring = (initial: number, cfg: { stiffness: number; damping: number; mass: number }) => {
  const mv = motionValue(initial);
  let v = 0;
  let raf = 0;
  let last = 0;
  const step = (now: number) => {
    const dt = last ? Math.min(0.032, (now - last) / 1000) : 1 / 120;
    last = now;
    const x = mv.get();
    const a = (-cfg.stiffness * (x - target) - cfg.damping * v) / cfg.mass;
    v += a * dt;
    mv.set(x + v * dt);
    if (Math.abs(mv.get() - target) < 0.0005 && Math.abs(v) < 0.005) {
      mv.set(target);
      v = 0;
      raf = 0;
      last = 0;
      return;
    }
    raf = requestAnimationFrame(step);
  };
  let target = initial;
  return {
    mv,
    setTarget(next: number) {
      target = next;
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(step);
      }
    },
    jump(next: number) {
      target = next;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      v = 0;
      mv.jump(next);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  };
};

const SquishSwitch = (props: SquishSwitchProps) => {
  const reduce = usePrefersReducedMotion();
  const width = () => props.width ?? 76;
  const height = () => props.height ?? 38;
  const inset = () => Math.max(3, Math.round(height() * 0.11));
  const thumb = () => height() - inset() * 2;
  const min = () => inset();
  const max = () => width() - inset() - thumb();
  const mid = () => (min() + max()) / 2;
  const trackRadius = () => Math.min(props.radius ?? 19, height() / 2);
  const thumbRadius = () => Math.max(2, trackRadius() - inset());

  const isControlled = () => props.checked !== undefined;
  const [inner, setInner] = createSignal(props.defaultChecked ?? false);
  const on = () => (isControlled() ? (props.checked as boolean) : inner());
  const [dragging, setDragging] = createSignal(false);
  let trackEl: HTMLSpanElement | null = null;
  let thumbEl: HTMLSpanElement | null = null;
  let grip: Grip | null = null;
  let onRef = on();
  let skipClick = false;
  let skipTimer: ReturnType<typeof setTimeout> | undefined;
  const autoId = createUniqueId();
  const buttonId = () => props.id ?? autoId;

  const x = motionValue(on() ? max() : min());
  // flow springs toward x's velocity (upstream: useSpring(useVelocity(x))).
  const flow = trackingSpring(0, FLOW_SPRING);
  const swell = trackingSpring(1, SWELL_SPRING);
  const gainOf = () => (reduce() ? 0 : clamp(props.stretch ?? 36, 0, 100) / 100);
  const stretchOf = (v: number) => 1 + Math.min(MAX_STRETCH, Math.abs(v) / STRETCH_SPEED) * gainOf();

  const paint = () => {
    if (!thumbEl) return;
    const sx = stretchOf(flow.mv.get()) * swell.mv.get();
    const sy = swell.mv.get() / stretchOf(flow.mv.get());
    thumbEl.style.transform = `translateX(${x.get()}px) scaleX(${sx}) scaleY(${sy})`;
  };

  onMount(() => {
    const offs = [
      x.on('change', () => {
        paint();
        // Feed the flow spring while x moves (drag or tween).
        flow.setTarget(x.getVelocity());
      }),
      flow.mv.on('change', paint),
      swell.mv.on('change', paint)
    ];
    paint();
    onCleanup(() => {
      offs.forEach(off => off());
      flow.stop();
      swell.stop();
    });
  });

  createEffect(() => {
    // Keep upstream's onRef semantics: commit() compares against the latest on.
    onRef = on();
  });

  createEffect(() => {
    // Upstream deps: [on, dragging, min, max, speed, reduce, x]
    const onNow = on();
    const isDragging = dragging();
    const minNow = min();
    const maxNow = max();
    const speed = props.speed ?? 50;
    const reduceNow = reduce();
    if (isDragging) return;
    const target = onNow ? maxNow : minNow;
    if (reduceNow) {
      x.jump(target);
      paint();
      return;
    }
    const controls = animate(x, target, {
      type: 'spring',
      stiffness: 170 - (50 - clamp(speed, 0, 100)) * 1.1,
      damping: 21.5,
      mass: 0.9,
      restDelta: 0.001,
      restSpeed: 0.01
    });
    onCleanup(() => controls.stop());
  });

  const commit = (next: boolean) => {
    if (next === onRef) return;
    onRef = next;
    if (!isControlled()) setInner(next);
    props.onChange?.(next);
  };

  const localX = (clientX: number) => {
    const el = trackEl;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const scale = rect.width / (el.offsetWidth || rect.width) || 1;
    return (clientX - rect.left) / scale;
  };
  const down = (e: PointerEvent) => {
    if (props.disabled || grip || e.button !== 0) return;
    grip = {
      id: e.pointerId,
      grab: null,
      moved: false,
      startX: e.clientX,
      onAtPress: onRef,
      slop: e.pointerType === 'touch' ? TAP_SLOP.coarse : TAP_SLOP.fine
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setDragging(true);
  };
  const move = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const lx = localX(e.clientX);
    if (g.grab === null) {
      g.grab = lx - x.get();
      return;
    }
    if (!g.moved && Math.abs(e.clientX - g.startX) > g.slop) g.moved = true;
    if (!g.moved) return;
    const nx = clamp(lx - g.grab, min(), max());
    x.set(nx);
    commit(nx > mid());
  };
  const up = (e: { pointerId: number; currentTarget: HTMLButtonElement }, cancelled: boolean) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (cancelled) commit(g.onAtPress);
    else if (!g.moved) commit(!onRef);
    skipClick = true;
    clearTimeout(skipTimer);
    skipTimer = setTimeout(() => {
      skipClick = false;
    }, 0);
    setDragging(false);
  };
  const click = () => {
    if (skipClick) {
      skipClick = false;
      return;
    }
    if (!props.disabled) commit(!onRef);
  };
  onCleanup(() => {
    clearTimeout(skipTimer);
  });

  return (
    <span class={`inline-flex items-center gap-2.5${props.className ? ` ${props.className}` : ''}`}>
      <button
        id={buttonId()}
        type="button"
        role="switch"
        aria-checked={on()}
        aria-disabled={props.disabled || undefined}
        aria-label={props.ariaLabel}
        class="group relative m-0 inline-block cursor-pointer touch-pan-y border-0 bg-transparent p-0 outline-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] after:absolute after:-inset-2 after:content-[''] data-[held]:cursor-grabbing aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        data-on={on() ? '' : undefined}
        data-held={dragging() ? '' : undefined}
        style={
          {
            '--ss-w': `${width()}px`,
            '--ss-h': `${height()}px`,
            '--ss-inset': `${inset()}px`,
            '--ss-thumb': `${thumb()}px`,
            '--ss-r': `${trackRadius()}px`,
            '--ss-thumb-r': `${thumbRadius()}px`,
            '--ss-track': props.trackColor ?? '#27272a',
            '--ss-track-on': props.trackOnColor ?? '#f5f5f5',
            '--ss-thumb-color':
              props.thumbColor || `color-mix(in srgb, ${props.trackOnColor ?? '#f5f5f5'} 19%, ${props.trackColor ?? '#27272a'})`,
            '--ss-thumb-on': props.thumbOnColor || (props.trackColor ?? '#27272a'),
            '--ss-fade': `${props.colorDuration ?? 320}ms`
          } as JSX.CSSProperties
        }
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={e => up(e, false)}
        onPointerCancel={e => up(e, true)}
        onPointerEnter={e => {
          if (e.pointerType === 'mouse' && !props.disabled) swell.setTarget(props.hoverScale ?? 1.035);
        }}
        onPointerLeave={() => swell.setTarget(1)}
        onKeyDown={e => {
          if (e.key === 'Escape' && grip) up({ pointerId: grip.id, currentTarget: e.currentTarget }, true);
        }}
        onClick={click}
      >
        <span
          ref={el => {
            trackEl = el;
          }}
          class="relative block [width:var(--ss-w)] [height:var(--ss-h)] [border-radius:var(--ss-r)] [background:var(--ss-track)] [transition:background-color_var(--ss-fade)_ease] group-data-[on]:[background:var(--ss-track-on)] motion-reduce:[transition-duration:1ms]"
        >
          <span
            ref={el => {
              thumbEl = el;
              if (el) paint();
            }}
            class="absolute left-0 [top:var(--ss-inset)] [width:var(--ss-thumb)] [height:var(--ss-thumb)] [border-radius:var(--ss-thumb-r)] [background:var(--ss-thumb-color)] [transition:background-color_var(--ss-fade)_ease] group-data-[on]:[background:var(--ss-thumb-on)] motion-reduce:[transition-duration:1ms]"
            aria-hidden="true"
          />
        </span>
      </button>
      <Show when={props.label}>
        <label for={buttonId()} class="cursor-pointer select-none">
          {props.label}
        </label>
      </Show>
    </span>
  );
};

export default SquishSwitch;
