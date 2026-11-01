import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';

export interface SloshGaugeProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  interactive?: boolean;
  showValue?: boolean;
  disabled?: boolean;
  liquidColor?: string;
  glassColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  ticks?: number;
  viscosity?: number;
  tilt?: number;
  splash?: number;
  unit?: string;
  ariaLabel?: string;
  className?: string;
}

interface Sim {
  x: number;
  v: number;
  L: number;
  raf: number;
  last: number;
}

interface Grip {
  id: number;
  rect: DOMRect;
  scale: number;
  band: boolean;
  grab: number | null;
  at: number;
  sent: number;
}

interface Live {
  viscosity: number;
  tilt: number;
  splash: number;
  width: number;
  height: number;
  value: number | undefined;
  onChange: ((value: number) => void) | undefined;
  unit: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const H = 1 / 120;
const DT_MAX = 0.05;
const TILT_GAIN = 0.07;
const TILT_MAX = 30;
const REST_POS = 0.05;
const REST_VEL = 2;
const STEP = 2;
const BIG = 10;
const BAND = 10;

const onColor = (hex: string) => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(c => c + c).join('') : raw;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  return (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 >= 150 ? '#111111' : '#ffffff';
};

const SloshGauge = (props: SloshGaugeProps) => {
  let rootEl!: HTMLDivElement;
  let liquidEl: HTMLDivElement | null = null;
  let markerEl: HTMLDivElement | null = null;
  let textAEl: HTMLSpanElement | null = null;
  let textBEl: HTMLSpanElement | null = null;
  const width = () => props.width ?? 88;
  const height = () => props.height ?? 180;
  const start = clamp(props.value ?? props.defaultValue ?? 60, 0, 100);
  const sim: Sim = { x: start, v: 0, L: start, raf: 0, last: 0 };
  let grip: Grip | null = null;
  const reduce = { current: false };
  const [held, setHeld] = createSignal(false);
  const live: { current: Live } = {
    current: {} as Live
  };
  createEffect(() => {
    live.current = {
      viscosity: props.viscosity ?? 0.15,
      tilt: props.tilt ?? 0.45,
      splash: props.splash ?? 0.42,
      width: width(),
      height: height(),
      value: props.value,
      onChange: props.onChange,
      unit: props.unit ?? '%'
    };
  });

  const paint = () => {
    const { x, v, L } = sim;
    const { tilt: t, width: W, height: Hh } = live.current;
    const th = reduce.current ? 0 : clamp(t * v * TILT_GAIN, -TILT_MAX, TILT_MAX);
    const lean = (Math.tan((th * Math.PI) / 180) * W) / 2;
    const top = 100 - x;
    if (liquidEl) {
      liquidEl.style.clipPath = `polygon(0 calc(${top}% + ${lean}px), 100% calc(${top}% - ${lean}px), 100% 100%, 0 100%)`;
    }
    if (markerEl) markerEl.style.transform = `translateY(${((100 - L) * Hh) / 100}px)`;
  };

  const say = () => {
    const n = Math.round(sim.L);
    const s = `${n}${live.current.unit}`;
    rootEl?.setAttribute('aria-valuenow', String(n));
    if (textAEl) textAEl.textContent = s;
    if (textBEl) textBEl.textContent = s;
  };

  const tick = (now: number) => {
    const s = sim;
    const { viscosity: vis, splash: give } = live.current;
    const dt = s.last ? Math.min((now - s.last) / 1000, DT_MAX) : H;
    s.last = now;
    if (vis <= 0) {
      s.x = s.L;
      s.v = 0;
    } else {
      const k = 1224 - 1044 * vis;
      const zeta = reduce.current ? 1 : 0.26 - 0.17 * vis;
      const c = 2 * zeta * Math.sqrt(k);
      const rest = reduce.current ? 0 : give;
      for (let n = Math.ceil(dt / H), h = dt / n; n > 0; n -= 1) {
        s.v = s.v * Math.exp(-c * h) + k * (s.L - s.x) * h;
        s.x += s.v * h;
        if (s.x > 100) {
          s.x = 100;
          s.v = -s.v * rest;
        } else if (s.x < 0) {
          s.x = 0;
          s.v = -s.v * rest;
        }
      }
      if (!grip && Math.abs(s.L - s.x) < REST_POS && Math.abs(s.v) < REST_VEL) {
        s.x = s.L;
        s.v = 0;
      }
    }
    paint();
    const parked = !grip && s.x === s.L && s.v === 0;
    if (parked) {
      s.raf = 0;
      s.last = 0;
    } else {
      s.raf = requestAnimationFrame(tick);
    }
  };
  const wake = () => {
    if (!sim.raf) sim.raf = requestAnimationFrame(tick);
  };
  const setLevel = (L: number, instant?: boolean) => {
    const s = sim;
    s.L = clamp(L, 0, 100);
    if (instant) {
      s.x = s.L;
      s.v = 0;
    }
    say();
    wake();
  };

  createEffect(() => {
    // Upstream: useLayoutEffect on [value].
    const value = props.value;
    if (value === undefined) return;
    if (grip && Math.round(sim.L) === value) return;
    setLevel(value, false);
  });

  onMount(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reduce.current = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    say();
    paint();
    onCleanup(() => {
      mq.removeEventListener('change', sync);
      cancelAnimationFrame(sim.raf);
    });
  });

  createEffect(() => {
    // Upstream deps: [width, height, tilt, showValue, interactive, disabled]
    width();
    height();
    props.tilt;
    props.showValue;
    props.interactive;
    props.disabled;
    paint();
  });

  const levelAt = (clientY: number, g: Grip) =>
    clamp(((g.rect.bottom - clientY) / g.scale / (rootEl?.offsetHeight || g.rect.height)) * 100, 0, 100);
  const report = () => {
    const g = grip;
    const n = Math.round(sim.L);
    if (g && n !== g.sent) {
      g.sent = n;
      live.current.onChange?.(n);
    }
  };

  const down = (e: PointerEvent) => {
    if (!props.interactive || props.disabled || grip || e.button !== 0) return;
    const el = rootEl;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = rect.height / (el.offsetHeight || rect.height) || 1;
    const markerY = rect.top + ((100 - sim.L) / 100) * rect.height;
    const g: Grip = {
      id: e.pointerId,
      rect,
      scale,
      band: Math.abs(e.clientY - markerY) <= BAND * scale,
      grab: null,
      at: sim.L,
      sent: NaN
    };
    grip = g;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    setHeld(true);
    if (g.band) {
      wake();
    } else {
      setLevel(levelAt(e.clientY, g));
      report();
    }
  };
  const move = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const at = levelAt(e.clientY, g);
    if (g.band && g.grab === null) {
      g.grab = sim.L - at;
      return;
    }
    setLevel(at + (g.grab ?? 0));
    report();
  };
  const up = (e: { pointerId: number }, reason?: 'cancel' | 'escape') => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    try {
      rootEl?.releasePointerCapture(e.pointerId);
    } catch {}
    setHeld(false);
    if (reason === 'escape') {
      setLevel(g.at);
      live.current.onChange?.(Math.round(g.at));
    } else if (live.current.value !== undefined && Math.round(sim.L) !== live.current.value) {
      setLevel(live.current.value);
    }
    wake();
  };
  const key = (e: KeyboardEvent) => {
    if (!props.interactive || props.disabled) return;
    if (e.key === 'Escape') {
      if (grip) up({ pointerId: grip.id }, 'escape');
      return;
    }
    const L = sim.L;
    const d = e.shiftKey ? BIG : STEP;
    const next: number | undefined = (
      {
        ArrowUp: L + d,
        ArrowRight: L + d,
        ArrowDown: L - d,
        ArrowLeft: L - d,
        PageUp: L + BIG,
        PageDown: L - BIG,
        Home: 0,
        End: 100
      } as Record<string, number>
    )[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setLevel(next, true);
    live.current.onChange?.(Math.round(sim.L));
  };

  const r = () => Math.min(props.radius ?? 20, width() / 2, height() / 2);
  const label = `${Math.round(start)}${props.unit ?? '%'}`;
  const ticks = () => props.ticks ?? 4;

  return (
    <div
      ref={rootEl}
      class={`group relative isolate box-border inline-block overflow-clip leading-none font-semibold tabular-nums outline-none select-none [width:var(--sg-w)] [height:var(--sg-h)] [border-radius:var(--sg-r)] [background:var(--sg-glass)] [font-size:var(--sg-font)] [-webkit-tap-highlight-color:transparent] data-[interactive=true]:cursor-ns-resize data-[interactive=true]:touch-none data-[interactive=true]:[-webkit-touch-callout:none] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50${props.className ? ` ${props.className}` : ''}`}
      role={props.interactive ? 'slider' : 'meter'}
      tabIndex={props.interactive && !props.disabled ? 0 : undefined}
      aria-label={props.ariaLabel ?? 'Level'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(start)}
      aria-orientation={props.interactive ? 'vertical' : undefined}
      aria-disabled={props.disabled || undefined}
      data-interactive={props.interactive ? 'true' : 'false'}
      data-held={held() ? 'true' : 'false'}
      data-disabled={props.disabled ? 'true' : 'false'}
      style={
        {
          '--sg-w': `${width()}px`,
          '--sg-h': `${height()}px`,
          '--sg-r': `${r()}px`,
          '--sg-glass': props.glassColor ?? '#27272a',
          '--sg-liquid': props.liquidColor ?? '#f5f5f5',
          '--sg-on-liquid': onColor(props.liquidColor ?? '#f5f5f5'),
          '--sg-ticks': ticks(),
          '--sg-font': `${clamp(Math.round(width() * 0.16), 12, 20)}px`
        } as JSX.CSSProperties
      }
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={e => up(e)}
      onPointerCancel={e => up(e, 'cancel')}
      onLostPointerCapture={e => up(e, 'cancel')}
      onKeyDown={key}
    >
      {props.showValue ?? true ? (
        <span
          ref={el => {
            textAEl = el;
          }}
          class="pointer-events-none absolute inset-0 grid place-items-center [color:color-mix(in_srgb,currentColor_65%,transparent)]"
          aria-hidden="true"
        >
          {label}
        </span>
      ) : null}
      <div
        ref={el => {
          liquidEl = el;
        }}
        class="absolute inset-0 [background:var(--sg-liquid)] [clip-path:polygon(0_100%,100%_100%,100%_100%,0_100%)]"
        aria-hidden="true"
      >
        {props.showValue ?? true ? (
          <span
            ref={el => {
              textBEl = el;
            }}
            class="pointer-events-none absolute inset-0 grid place-items-center [color:var(--sg-on-liquid)]"
          >
            {label}
          </span>
        ) : null}
      </div>
      {ticks() > 0 ? (
        <div
          class="pointer-events-none absolute right-0 bottom-0 h-full w-[22%] bg-bottom bg-repeat-y [background-image:linear-gradient(to_top,color-mix(in_srgb,currentColor_22%,transparent)_0_1px,transparent_1px)] [background-size:100%_calc(100%/var(--sg-ticks))]"
          aria-hidden="true"
        />
      ) : null}
      {props.interactive && !props.disabled ? (
        <div
          ref={el => {
            markerEl = el;
          }}
          class="pointer-events-none absolute inset-x-[10%] top-0 -mt-px h-0.5 rounded-[1px] bg-current opacity-0 [transition:opacity_150ms_ease] group-data-[held=true]:opacity-100"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};

export default SloshGauge;
