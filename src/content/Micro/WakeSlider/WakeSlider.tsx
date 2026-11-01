import { createEffect, createSignal, Index, onCleanup } from 'solid-js';
import { cancelFrame, frame, motionValue, springValue } from 'motion';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

const SETTLE = 9.23;
const FULL_SPEED = 320;
const MIN_REACH = 1.5;
const FLAT = 0.002;

export interface WakeSliderProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  bars?: number;
  height?: number;
  restHeight?: number;
  gap?: number;
  fillColor?: string;
  trackColor?: string;
  crestColor?: string;
  sensitivity?: number;
  reach?: number;
  skew?: number;
  glide?: number;
  smoothing?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  class?: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (s: number) => s * s * (3 - 2 * s);
const toPct = (v: number, min: number, max: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
const snap = (v: number, min: number, max: number, step: number) => {
  if (!(max > min)) return min;
  if (!(step > 0)) return clamp(v, min, max);
  const lastWhole = min + Math.floor(+((max - min) / step).toFixed(6)) * step;
  const grid = clamp(Math.round((v - min) / step) * step + min, min, lastWhole);
  return +(lastWhole < max && Math.abs(v - max) <= Math.abs(v - grid) ? max : grid).toFixed(6);
};

const WakeSlider = (props: WakeSliderProps) => {
  const reduce = usePrefersReducedMotion();
  const [inner, setInner] = createSignal(props.defaultValue ?? 50);
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const step = () => props.step ?? 1;
  const bars = () => props.bars ?? 32;
  const height = () => props.height ?? 56;
  const value = () => clamp(props.value ?? inner(), min(), max());
  const pct = () => toPct(value(), min(), max());
  const format = () => props.formatValue ?? String;
  const rest = () => Math.min(props.restHeight ?? 12, height() - 1) / height();

  let rootEl: HTMLDivElement | null = null;
  let trackEl: HTMLDivElement | null = null;
  let handleEl: HTMLButtonElement | null = null;
  const barEls: (HTMLSpanElement | null)[] = [];
  const crestEls: (HTMLSpanElement | null)[] = [];
  let activePointer: number | null = null;
  let lastAmp = 0;
  let latest = value();

  // PORT-NOTE: upstream useSpring(useMotionValue) chain — mapped to the vanilla
  // springValue() from `motion`, plus a hand-rolled velocity tracker feeding the
  // smoothed speed spring (vanilla `motion` has no useVelocity).
  const target = motionValue(pct());
  const w0 = SETTLE / (props.glide ?? 0.3);
  const head = springValue(target, { stiffness: w0 * w0, damping: 2 * w0, mass: 1 });
  const rawSpeed = motionValue(0);
  const wv = 2000 / (props.smoothing ?? 100);
  const speed = springValue(rawSpeed, { stiffness: wv * wv, damping: 2.5 * wv, mass: 1 });

  let lastHead = head.get();
  let lastChangeT = performance.now();
  let proc: ReturnType<typeof frame.render> | null = null;

  const paint = (force = false) => {
    const n = bars();
    const h = ((reduce() ? target.get() : head.get()) / 100) * (n - 1);
    const v = reduce() ? 0 : speed.get();
    const amp = smoothstep(clamp((Math.abs(v) * (props.sensitivity ?? 1)) / FULL_SPEED, 0, 1));
    const dir = Math.sign(v) || 1;
    const r = MIN_REACH + ((props.reach ?? 6) - MIN_REACH) * amp;
    const behind = r * (1 + (props.skew ?? 0.6));
    const ahead = r * (1 - 0.5 * (props.skew ?? 0.6));
    const lit = Math.round(h);
    const flat = !force && amp < FLAT && lastAmp < FLAT;
    for (let i = 0; i < n; i++) {
      const el = barEls[i];
      if (!el) continue;
      const on = i <= lit ? 'true' : 'false';
      if (el.dataset.on !== on) el.dataset.on = on;
      if (flat) continue;
      const d = i - h;
      const R = d * dir < 0 ? behind : ahead;
      const lift = Math.abs(d) < R ? amp * Math.cos((Math.PI * d) / (2 * R)) ** 2 : 0;
      el.style.transform = `scaleY(${rest() + lift * (1 - rest())})`;
      const crest = crestEls[i];
      if (crest) crest.style.opacity = String(lift);
    }
    lastAmp = amp;
  };
  const runPaint = () => paint();
  const schedule = () => {
    proc = frame.render(runPaint, false, true);
  };
  const offHead = head.on('change', v => {
    const now = performance.now();
    const dt = Math.max(1, now - lastChangeT) / 1000;
    rawSpeed.set((v - lastHead) / dt);
    lastHead = v;
    lastChangeT = now;
    schedule();
  });
  const offSpeed = speed.on('change', schedule);

  onCleanup(() => {
    offHead();
    offSpeed();
    if (proc) cancelFrame(proc);
    target.stop();
    head.stop();
    rawSpeed.stop();
    speed.stop();
  });

  createEffect(() => {
    target.set(pct());
  });
  createEffect(() => {
    latest = value();
  });
  // Upstream re-ran paint(true) after every render (dep-less useLayoutEffect);
  // paint() itself tracks every prop it reads, so this effect covers the same set.
  createEffect(() => {
    barEls.length = bars();
    crestEls.length = bars();
    paint(true);
  });

  const commit = (next: number) => {
    const clean = snap(next, min(), max(), step());
    if (clean === latest) return;
    latest = clean;
    if (props.value === undefined) setInner(clean);
    props.onChange?.(clean);
  };
  const commitFromX = (x: number) => {
    const track = trackEl;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    let ratio = clamp((x - rect.left) / rect.width, 0, 1);
    if (getComputedStyle(track).direction === 'rtl') ratio = 1 - ratio;
    commit(min() + ratio * (max() - min()));
  };
  const onPointerDown = (e: PointerEvent) => {
    if ((props.disabled ?? false) || activePointer !== null) return;
    activePointer = e.pointerId;
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {}
    rootEl?.removeAttribute('data-instant');
    handleEl?.focus({ preventScroll: true });
    commitFromX(e.clientX);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId === activePointer) commitFromX(e.clientX);
  };
  const endDrag = (e: PointerEvent) => {
    if (e.pointerId !== activePointer) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
    activePointer = null;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (props.disabled ?? false) return;
    const v = value();
    const jumps: Record<string, number> = {
      ArrowRight: v + step(),
      ArrowUp: v + step(),
      ArrowLeft: v - step(),
      ArrowDown: v - step(),
      PageUp: v + step() * 10,
      PageDown: v - step() * 10,
      Home: min(),
      End: max()
    };
    if (!(e.key in jumps)) return;
    e.preventDefault();
    const clean = snap(jumps[e.key], min(), max(), step());
    const p = toPct(clean, min(), max());
    rootEl?.setAttribute('data-instant', 'true');
    target.jump(p);
    head.jump(p);
    rawSpeed.jump(0);
    speed.jump(0);
    lastHead = p;
    lastChangeT = performance.now();
    commit(clean);
    paint(true);
  };

  return (
    <div
      ref={el => {
        rootEl = el;
      }}
      class={`group inline-flex w-full items-center gap-3 [color:inherit] aria-disabled:pointer-events-none aria-disabled:opacity-50${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      aria-disabled={(props.disabled ?? false) || undefined}
      style={{
        '--ws-fill': props.fillColor ?? '#f5f5f5',
        '--ws-track': props.trackColor ?? '#27272a',
        '--ws-crest': props.crestColor || (props.fillColor ?? '#f5f5f5'),
        '--ws-height': `${height()}px`,
        '--ws-gap': `${props.gap ?? 4}px`,
        '--ws-rest': rest()
      }}
    >
      <div
        ref={el => {
          trackEl = el;
        }}
        class="relative flex h-[var(--ws-height)] min-h-11 flex-1 touch-none items-center gap-[var(--ws-gap)] select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [@media(hover:hover)_and_(pointer:fine)]:cursor-grab [@media(hover:hover)_and_(pointer:fine)]:active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <Index each={Array.from({ length: bars() })}>
          {(_, i) => (
            <span
              ref={el => {
                barEls[i] = el;
              }}
              class="relative h-[var(--ws-height)] min-w-0 flex-1 origin-center rounded-full bg-[var(--ws-track)] [transform:scaleY(var(--ws-rest))] [transition:background-color_120ms_ease] data-[on=true]:bg-[var(--ws-fill)] group-data-[instant=true]:[transition-duration:0ms] motion-reduce:[transform:scaleY(var(--ws-rest))]!"
            >
              {props.crestColor ? (
                <span
                  ref={el => {
                    crestEls[i] = el;
                  }}
                  class="absolute inset-0 rounded-[inherit] bg-[var(--ws-crest)] opacity-0"
                />
              ) : null}
            </span>
          )}
        </Index>
        <button
          ref={el => {
            handleEl = el;
          }}
          type="button"
          role="slider"
          class="absolute inset-0 m-0 cursor-[inherit] touch-none rounded-xl border-0 bg-transparent p-0 outline-none [-webkit-tap-highlight-color:transparent]"
          tabIndex={(props.disabled ?? false) ? -1 : 0}
          aria-label={props.ariaLabel ?? 'Value'}
          aria-valuemin={min()}
          aria-valuemax={max()}
          aria-valuenow={value()}
          aria-valuetext={format()(value())}
          aria-disabled={(props.disabled ?? false) || undefined}
          onKeyDown={onKeyDown}
        />
      </div>
      {props.showValue ? (
        <span class="min-w-[3ch] text-right text-[13px] tabular-nums opacity-60" aria-hidden="true">
          {format()(value())}
        </span>
      ) : null}
    </div>
  );
};

export default WakeSlider;
