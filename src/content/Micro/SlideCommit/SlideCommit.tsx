import { createEffect, createSignal, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import HugeiconsIcon from '@/lib/HugeiconsIcon';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';
import { ArrowRight02Icon, Tick02Icon } from '@hugeicons/core-free-icons';

export type SlideCommitPhase = 'idle' | 'pending' | 'done' | 'error';

export interface SlideCommitProps {
  label?: JSX.Element;
  doneLabel?: JSX.Element;
  errorLabel?: JSX.Element;
  onConfirm?: () => void | Promise<unknown>;
  onDone?: () => void;
  onError?: (reason: unknown) => void;
  trackColor?: string;
  handleColor?: string;
  successColor?: string;
  dangerColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  speed?: number;
  returnBounce?: number;
  landingDip?: number;
  holdMs?: number;
  disabled?: boolean;
  icon?: JSX.Element;
  className?: string;
  class?: string;
}

type Sample = [number, number];
type Grip = { id: number; grab: number | null; moved: boolean; hist: Sample[] };
type MoveEvent = { pointerId: number; clientX: number; timeStamp: number };
type UpEvent = { pointerId: number };

const PAD = 4;
const SQUASH_MAX = 0.08;
const SQUASH_DIV = 110;
const SWELL = 1.03;
const MIN_PENDING = 300;
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SHAKE = [0, -5, 5, -3, 3, -1, 0];
const STYLE = `
@keyframes sc-spin { to { transform: rotate(360deg); } }
.sc-spinner { animation: sc-spin 1s linear infinite; animation-play-state: paused; }
.sc-root[data-phase='pending'] .sc-spinner { animation-play-state: running; }
@media (prefers-reduced-motion: reduce) {
  .sc-spinner { animation: sc-breathe 1.4s ease-in-out infinite; animation-play-state: paused; }
  .sc-root[data-phase='pending'] .sc-spinner { animation-play-state: running; }
  @keyframes sc-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
}
`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const onColor = (hex: string) => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(ch => ch + ch).join('') : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return yiq >= 128 ? '#111111' : '#ffffff';
};
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0;
  const [t0, x0] = hist[0];
  const [t1, x1] = hist[hist.length - 1];
  return ((x1 - x0) / Math.max(1, t1 - t0)) * 1000;
};
const finePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

const Spinner = (props: { size: number }) => (
  <svg class="sc-spinner block" width={props.size} height={props.size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-opacity="0.25" />
    <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
  </svg>
);

const SlideCommit = (props: SlideCommitProps) => {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = createSignal<SlideCommitPhase>('idle');
  const [held, setHeld] = createSignal(false);
  const [hot, setHot] = createSignal(false);

  let trackEl!: HTMLDivElement;
  let capsuleEl!: HTMLDivElement;
  let sayEl!: HTMLSpanElement;
  let contentEl!: HTMLDivElement;
  let arrowEl!: HTMLSpanElement;
  let spinEl!: HTMLSpanElement;
  let doneEl!: HTMLSpanElement;
  let grip: Grip | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let homeTimer: ReturnType<typeof setTimeout> | undefined;
  let run = 0;
  let unwatch: (() => void) | null = null;
  let lastPercent = 0;

  const GRIP = () => (props.height ?? 56) - PAD * 2;
  const INNER = () => (props.width ?? 280) - PAD * 2;
  const TRAVEL = () => Math.max(1, INNER() - GRIP());
  const r = () => clamp(props.radius ?? 28, 0, (props.height ?? 56) / 2);
  const gripR = () => Math.max(0, r() - PAD);
  const labelText = () => (typeof props.label === 'string' ? props.label : 'Slide to confirm');

  const x = motionValue(0);
  const anchor = motionValue(0);
  const shown = motionValue(1);
  const spin = motionValue(0);
  const pulse = motionValue(1);
  const shake = motionValue(0);
  const seen = motionValue(0);

  // Upstream derived everything through useTransform/useMotionTemplate chains;
  // here one sync pass recomputes all of them and writes styles directly.
  const sync = () => {
    const v = clamp(x.get(), 0, TRAVEL());
    seen.set(v);
    const R = v + GRIP() + clamp(anchor.get() - v, 0, TRAVEL());
    if (capsuleEl) {
      capsuleEl.style.clipPath = `inset(0 ${INNER() - R}px 0 0 round ${gripR()}px)`;
      capsuleEl.style.transformOrigin = `${v}px 50%`;
      const swell = hot() && !held() && phase() === 'idle' && !reduce() ? SWELL : 1;
      const q = 1 - Math.min(SQUASH_MAX, Math.max(0, -x.get()) / SQUASH_DIV);
      capsuleEl.style.transform = `scale(${q * swell}, ${swell / q})`;
    }
    if (contentEl) contentEl.style.transform = `translateX(${(v + R) / 2 - INNER() / 2}px)`;
    if (sayEl) sayEl.style.opacity = String(1 - clamp(v / (TRAVEL() * 0.55), 0, 1));
    if (arrowEl) arrowEl.style.opacity = String(shown.get() * clamp(1 - (v - TRAVEL() * 0.55) / (TRAVEL() * 0.4), 0, 1));
    if (trackEl) trackEl.style.transform = `translateX(${shake.get()}px) scale(${pulse.get()})`;
  };

  onMount(() => {
    const offs = [x.on('change', sync), anchor.on('change', sync), shown.on('change', sync), shake.on('change', sync), pulse.on('change', sync)];
    const offSpin = spin.on('change', v => {
      if (spinEl) spinEl.style.opacity = String(v);
    });
    const offSeen = seen.on('change', v => {
      const percent = Math.round((v / TRAVEL()) * 100);
      if (percent === lastPercent || !capsuleEl) return;
      lastPercent = percent;
      capsuleEl.setAttribute('aria-valuenow', String(percent));
      capsuleEl.setAttribute('aria-valuetext', `${labelText()}, ${percent}%`);
    });
    if (spinEl) spinEl.style.opacity = String(spin.get());
    sync();
    onCleanup(() => {
      offs.forEach(off => off());
      offSpin();
      offSeen();
      x.stop();
      anchor.stop();
      shown.stop();
      spin.stop();
      pulse.stop();
      shake.stop();
      seen.stop();
    });
  });

  onMount(() => {
    onCleanup(() => {
      clearTimeout(timer);
      clearTimeout(homeTimer);
      unwatch?.();
      run += 1;
    });
  });

  // Upstream: declarative animate on the done tick label.
  createEffect(() => {
    const done = phase() === 'done';
    const controls = animate(
      doneEl,
      { opacity: done ? 1 : 0, scale: done || reduce() ? 1 : 0.95 },
      { duration: 0.2, ease: EASE_OUT }
    );
    onCleanup(() => controls.stop());
  });

  const local = (clientX: number) => {
    const rect = trackEl?.getBoundingClientRect();
    if (!rect) return 0;
    return (clientX - rect.left) / (rect.width / (props.width ?? 280) || 1);
  };

  function goHome(velocity: number) {
    if (reduce()) animate(x, 0, { duration: 0.2, ease: EASE_OUT });
    else
      animate(x, 0, {
        type: 'spring',
        stiffness: 260 + (clamp(props.speed ?? 50, 0, 100) / 100) * 640,
        damping: 2 * Math.sqrt((260 + (clamp(props.speed ?? 50, 0, 100) / 100) * 640) * 0.9) * (1 - clamp(props.returnBounce ?? 0.38, 0, 0.5)),
        mass: 0.9,
        velocity: Math.min(0, velocity)
      });
  }

  function settle() {
    setPhase('idle');
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (reduce()) anchor.set(0);
    else animate(anchor, 0, { type: 'spring', duration: 0.3, bounce: 0 });
  }

  function resolve(viaKey: boolean) {
    setPhase('done');
    anchor.set(x.get());
    animate(spin, 0, { duration: 0.12 });
    if (reduce()) x.set(0);
    else {
      const k = 260 + (clamp(props.speed ?? 50, 0, 100) / 100) * 640;
      animate(x, 0, {
        type: 'spring',
        stiffness: k,
        damping: 2 * Math.sqrt(k * 0.9),
        mass: 0.9
      });
      const landingDip = props.landingDip ?? 0.026;
      if (!viaKey && landingDip > 0) {
        animate(pulse, [1, 1 - landingDip, 1], { duration: 0.46, times: [0, 0.62, 1], ease: EASE_OUT, delay: 0.1 });
      }
    }
    untrack(() => props.onDone?.());
    const holdMs = props.holdMs ?? 1500;
    if (holdMs > 0) timer = setTimeout(settle, holdMs);
  }

  function reject(reason: unknown) {
    setPhase('error');
    untrack(() => props.onError?.(reason));
    animate(spin, 0, { duration: 0.12 });
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (reduce()) goHome(0);
    else {
      animate(shake, SHAKE, { duration: 0.45, ease: EASE_OUT });
      homeTimer = setTimeout(() => {
        if (!grip) goHome(0);
      }, 300);
    }
    timer = setTimeout(() => setPhase('idle'), Math.max(props.holdMs ?? 1500, 1500));
  }

  function commit(viaKey: boolean) {
    clearTimeout(timer);
    const id = ++run;
    x.set(TRAVEL());
    let out: void | Promise<unknown>;
    try {
      out = untrack(() => props.onConfirm?.());
    } catch (reason) {
      reject(reason);
      return;
    }
    const pending = out && typeof out.then === 'function' ? out : null;
    if (!pending) {
      animate(shown, 0, { duration: 0.12 });
      resolve(viaKey);
      return;
    }
    setPhase('pending');
    animate(shown, 0, { duration: 0.2 });
    animate(spin, 1, { duration: 0.2 });
    const t0 = performance.now();
    const later = (fn: () => void) => {
      setTimeout(
        () => {
          if (id === run) fn();
        },
        Math.max(0, MIN_PENDING - (performance.now() - t0))
      );
    };
    pending.then(
      () => later(() => resolve(viaKey)),
      reason => later(() => reject(reason))
    );
  }

  function move(e: MoveEvent) {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const at = local(e.clientX);
    if (g.grab === null) {
      g.grab = at - x.get();
      return;
    }
    const next = clamp(at - g.grab, 0, TRAVEL());
    if (Math.abs(next - x.get()) > 0.5) g.moved = true;
    g.hist.push([e.timeStamp, next]);
    if (g.hist.length > 4) g.hist.shift();
    x.set(next);
  }

  function up(e: UpEvent) {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    unwatch?.();
    try {
      trackEl?.releasePointerCapture(e.pointerId);
    } catch {}
    setHeld(false);
    if (x.get() >= TRAVEL()) commit(false);
    else if (g.moved) goHome(velocityOf(g.hist));
  }

  const down = (e: PointerEvent) => {
    if (props.disabled || grip || phase() === 'pending' || phase() === 'done' || e.button !== 0) return;
    x.stop();
    grip = { id: e.pointerId, grab: null, moved: false, hist: [] };
    setHeld(true);
    try {
      trackEl?.setPointerCapture(e.pointerId);
    } catch {}
    unwatch?.();
    const onMove = (ev: PointerEvent) => ev.isTrusted && move(ev);
    const onUp = (ev: PointerEvent) => ev.isTrusted && up(ev);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    unwatch = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      unwatch = null;
    };
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (props.disabled || phase() === 'pending' || phase() === 'done') return;
    const step = TRAVEL() / 10;
    if (e.key === 'End') {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(TRAVEL(), x.get() + step);
      x.set(next);
      if (next >= TRAVEL()) commit(true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      x.set(Math.max(0, x.get() - step));
    } else if (e.key === 'Home' || e.key === 'Escape') {
      e.preventDefault();
      if (grip) up({ pointerId: grip.id });
      else x.set(0);
    }
  };

  const fontSize = () => clamp(Math.round((props.height ?? 56) * 0.25), 13, 17);
  const iconSize = () => Math.round(GRIP() * 0.42);

  return (
    <div
      class={`sc-root group relative inline-block align-middle [font-family:inherit] data-[disabled]:pointer-events-none data-[disabled]:opacity-[0.55]${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      data-phase={phase()}
      data-held={held() ? '' : undefined}
      data-disabled={props.disabled ? '' : undefined}
      style={{
        width: `${props.width ?? 280}px`,
        height: `${props.height ?? 56}px`,
        '--sc-track': props.trackColor ?? '#262626',
        '--sc-ink': props.handleColor ?? '#f5f5f5',
        '--sc-ok': props.successColor ?? '#22c55e',
        '--sc-no': props.dangerColor ?? '#e5484d',
        '--sc-on-ink': onColor(props.handleColor ?? '#f5f5f5'),
        '--sc-on-ok': onColor(props.successColor ?? '#22c55e'),
        '--sc-on-no': onColor(props.dangerColor ?? '#e5484d'),
        '--sc-radius': `${r()}px`,
        '--sc-grip-r': `${gripR()}px`,
        '--sc-pad': `${PAD}px`,
        '--sc-font': `${fontSize()}px`
      }}
    >
      <style>{STYLE}</style>
      <div
        ref={trackEl}
        class="relative h-full w-full cursor-grab touch-none select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] rounded-[var(--sc-radius)] [background:var(--sc-track)] group-data-[held]:cursor-grabbing group-data-[phase=pending]:cursor-default group-data-[phase=done]:cursor-default"
        onPointerDown={down}
      >
        <span
          ref={sayEl}
          class="pointer-events-none absolute inset-0 grid place-items-center whitespace-nowrap font-medium leading-none tracking-[-0.006em] [font-size:var(--sc-font)]"
          aria-hidden="true"
        >
          <span class="[grid-area:1/1] [transition:opacity_200ms_ease,filter_200ms_ease] [color:color-mix(in_srgb,var(--sc-ink)_45%,transparent)] group-data-[phase=error]:opacity-0 group-data-[phase=error]:blur-[2px]">
            {props.label ?? 'Slide to pay'}
          </span>
          <span class="[grid-area:1/1] [transition:opacity_200ms_ease,filter_200ms_ease] [color:var(--sc-no)] opacity-0 blur-[2px] group-data-[phase=error]:opacity-100 group-data-[phase=error]:blur-none">
            {props.errorLabel ?? 'Payment failed'}
          </span>
        </span>
        <div
          ref={capsuleEl}
          role="slider"
          tabIndex={props.disabled ? -1 : 0}
          aria-label={labelText()}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-busy={phase() === 'pending' || undefined}
          aria-disabled={props.disabled || undefined}
          class="absolute top-[var(--sc-pad)] left-[var(--sc-pad)] h-[calc(100%-var(--sc-pad)*2)] w-[calc(100%-var(--sc-pad)*2)] outline-none [background:var(--sc-ink)] [color:var(--sc-on-ink)] [transition:background-color_200ms_ease,color_200ms_ease] group-data-[phase=done]:[background:var(--sc-ok)] group-data-[phase=done]:[color:var(--sc-on-ok)] group-data-[phase=error]:[background:var(--sc-no)] group-data-[phase=error]:[color:var(--sc-on-no)] focus-visible:[box-shadow:inset_0_0_0_2px_var(--sc-track)]"
          onPointerEnter={e => {
            if (e.pointerType === 'mouse' && finePointer()) setHot(true);
          }}
          onPointerLeave={() => setHot(false)}
          onKeyDown={onKeyDown}
        >
          <div ref={contentEl} class="absolute inset-0">
            <span
              ref={arrowEl}
              class="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 whitespace-nowrap font-semibold leading-none tracking-[-0.006em] [font-size:var(--sc-font)] [transition:filter_200ms_ease] group-data-[phase=pending]:blur-[2px] [&>svg]:block"
              aria-hidden="true"
            >
              {props.icon ?? <HugeiconsIcon icon={ArrowRight02Icon} size={iconSize()} strokeWidth={2} />}
            </span>
            <span
              ref={spinEl}
              class="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 whitespace-nowrap font-semibold leading-none tracking-[-0.006em] [font-size:var(--sc-font)] [transition:filter_200ms_ease] blur-[2px] group-data-[phase=pending]:blur-none"
              aria-hidden="true"
            >
              <Spinner size={iconSize()} />
            </span>
            <span
              ref={doneEl}
              class="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 whitespace-nowrap font-semibold leading-none tracking-[-0.006em] [font-size:var(--sc-font)] [&>svg]:block"
              aria-hidden="true"
              style={{ opacity: '0' }}
            >
              <HugeiconsIcon icon={Tick02Icon} size={Math.round(GRIP() * 0.38)} strokeWidth={2.5} />
              {props.doneLabel ?? 'Paid'}
            </span>
          </div>
        </div>
        <span class="sr-only" aria-live="polite">
          {phase() === 'pending' ? 'Working' : phase() === 'done' ? (props.doneLabel ?? 'Paid') : phase() === 'error' ? (props.errorLabel ?? 'Payment failed') : ''}
        </span>
      </div>
    </div>
  );
};

export default SlideCommit;
