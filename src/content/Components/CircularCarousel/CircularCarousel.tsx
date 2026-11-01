import { createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from 'solid-js';
import { For, Index, Show } from 'solid-js';
import type { JSX } from 'solid-js';
// Solid helper from src/lib/reducedMotion (returns an accessor, must be called).
import { useReducedMotion } from '@/lib/reducedMotion';

export interface CircularCarouselItem {
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
}

export type CircularCarouselPreset = 'cylinder' | 'orbit' | 'wheel' | 'panorama';
export type CircularCarouselIntro = 'assemble' | 'rise' | 'spin' | 'none';
export type CircularCarouselAutoplay = 'drift' | 'step' | 'off';

export interface CircularCarouselProps {
  items?: CircularCarouselItem[];
  preset?: CircularCarouselPreset;
  intro?: CircularCarouselIntro;
  cardWidth?: number;
  aspectRatio?: number;
  gap?: number;
  curve?: number;
  tilt?: number;
  perspective?: number;
  autoplay?: CircularCarouselAutoplay;
  speed?: number;
  interval?: number;
  direction?: 'left' | 'right';
  draggable?: boolean;
  momentum?: number;
  snap?: boolean;
  pauseOnHover?: boolean;
  focusOnClick?: boolean;
  parallax?: number;
  stretch?: number;
  depthFade?: number;
  fadeColor?: string;
  innerShade?: number;
  cornerRadius?: number;
  captions?: boolean;
  onChange?: (index: number) => void;
  onItemClick?: (item: CircularCarouselItem, index: number) => void;
  className?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

type Vec3 = [number, number, number];

interface Layout {
  axis: 'x' | 'y';
  tilt: number;
  perspective: number;
  curve: number;
  spread: number;
  inward: boolean;
  billboard: boolean;
  backfaces: boolean;
  window: number;
}

interface Tile {
  index: number;
  total: number;
  start: number;
  end: number;
  size: number;
  move: string;
}

interface Sample {
  time: number;
  angle: number;
}

interface Press {
  id: number;
  x: number;
  y: number;
  angle: number;
  moved: boolean;
  origin: number;
  samples: Sample[];
}

interface CarouselState {
  angle: number;
  velocity: number;
  target: number | null;
  dir: number;
  press: Press | null;
  drag: boolean;
  hover: boolean;
  pointer: { inside: boolean; x: number; y: number };
  yaw: number;
  pitch: number;
  intro: { type: CircularCarouselIntro; start: number } | null;
  introDone: boolean;
  holdUntil: number;
  stepAt: number;
  suppressClick: boolean;
  wheelTimer: ReturnType<typeof setTimeout> | undefined;
  fit: number;
  shift: number;
  drop: number;
  last: number;
}

interface Settings {
  count: number;
  step: number;
  radius: number;
  layout: Layout;
  axis: 'x' | 'y';
  tilt: number;
  perspective: number;
  cardW: number;
  cardH: number;
  intro: CircularCarouselIntro;
  autoplay: CircularCarouselAutoplay;
  speed: number;
  interval: number;
  draggable: boolean;
  momentum: number;
  snap: boolean;
  pauseOnHover: boolean;
  parallax: number;
  stretch: number;
  depthFade: number;
  captions: boolean;
  reduced: boolean;
}

interface IntroPose {
  radius: number;
  lift: number;
}

interface Leaving {
  id: number;
  items: CircularCarouselItem[];
  delays: number[];
}

const STYLE = `
@keyframes circular-carousel-title { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes circular-carousel-leave { from { opacity: 1; } to { opacity: 0; } }
@keyframes circular-carousel-reveal { from { opacity: 0; } to { opacity: 1; } }
`;

const MASKS: Partial<Record<CircularCarouselPreset, string>> = {
  wheel: 'linear-gradient(to bottom, transparent, #000000 18%, #000000 82%, transparent)',
  panorama: 'linear-gradient(to right, transparent, #000000 12%, #000000 88%, transparent)'
};

const photo = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=max&sat=-100`;

const DEFAULT_ITEMS: CircularCarouselItem[] = [
  {
    src: photo('photo-1506744038136-46273834b3fb'),
    alt: 'Mist drifting through a mountain valley',
    title: 'Valley',
    subtitle: 'Landscape'
  },
  {
    src: photo('photo-1524504388940-b1c1722653e1'),
    alt: 'A woman with long hair in soft studio light',
    title: 'Portrait',
    subtitle: 'Studio'
  },
  {
    src: photo('photo-1486406146926-c627a92ad1ab'),
    alt: 'Glass towers seen from street level',
    title: 'Towers',
    subtitle: 'Architecture'
  },
  {
    src: photo('photo-1502680390469-be75c86b636f'),
    alt: 'A surfer carving inside a breaking wave',
    title: 'Swell',
    subtitle: 'Ocean'
  },
  {
    src: photo('photo-1487958449943-2429e8be8625'),
    alt: 'An angular white building against the sky',
    title: 'Facade',
    subtitle: 'Architecture'
  },
  {
    src: photo('photo-1509631179647-0177331693ae'),
    alt: 'A model in striped trousers leaning on a wall',
    title: 'Pose',
    subtitle: 'Editorial'
  },
  {
    src: photo('photo-1519681393784-d120267933ba'),
    alt: 'The Milky Way above snowy peaks',
    title: 'Night',
    subtitle: 'Sky'
  },
  {
    src: photo('photo-1485968579580-b6d095142e6e'),
    alt: 'A woman in a long coat on a city street',
    title: 'Street',
    subtitle: 'Editorial'
  },
  {
    src: photo('photo-1493246507139-91e8fad9978e'),
    alt: 'Mountains mirrored in a still lake',
    title: 'Mirror',
    subtitle: 'Landscape'
  },
  {
    src: photo('photo-1511818966892-d7d671e672a2'),
    alt: 'A glass skyscraper under a cloudy sky',
    title: 'Glass',
    subtitle: 'Architecture'
  }
];

const PRESETS: Record<CircularCarouselPreset, Layout> = {
  cylinder: {
    axis: 'y',
    tilt: -5,
    perspective: 2500,
    curve: 1,
    spread: 1,
    inward: false,
    billboard: false,
    backfaces: true,
    window: 0
  },
  orbit: {
    axis: 'y',
    tilt: -16,
    perspective: 1500,
    curve: 0,
    spread: 1.45,
    inward: false,
    billboard: true,
    backfaces: false,
    window: 0
  },
  wheel: {
    axis: 'x',
    tilt: 0,
    perspective: 1800,
    curve: 0,
    spread: 1,
    inward: false,
    billboard: false,
    backfaces: true,
    window: 1.7
  },
  panorama: {
    axis: 'y',
    tilt: 0,
    perspective: 0,
    curve: 1,
    spread: 1,
    inward: true,
    billboard: false,
    backfaces: false,
    window: 0
  }
};

const INTRO_LENGTH: Record<CircularCarouselIntro, number> = { assemble: 1500, rise: 1400, spin: 1800, none: 0 };
const TILES = 8;
const OVERLAP = 2.5;
const DRAG_THRESHOLD = 5;
const SPRING = 118;
const SETTLE_SPEED = 9;
const CAPTION_SPACE = 76;
const SWAP_LENGTH = 700;
const SWAP_SPREAD = 420;
const TO_RAD = Math.PI / 180;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

const rotateX = (p: Vec3, degrees: number): Vec3 => {
  const r = degrees * TO_RAD;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};

const rotateY = (p: Vec3, degrees: number): Vec3 => {
  const r = degrees * TO_RAD;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

const Digits = (digitProps: { value: number }) => (
  <span class="inline-flex">
    <For each={String(digitProps.value).padStart(2, '0').split('')}>
      {digit => (
        <span class="inline-block h-[1em] overflow-hidden">
          <span
            class="flex flex-col transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translateY(${-Number(digit) * 10}%)` }}
          >
            <For each={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}>
              {n => (
                <span class="h-[1em]">{n}</span>
              )}
            </For>
          </span>
        </span>
      )}
    </For>
  </span>
);

const CircularCarousel = (props: CircularCarouselProps) => {
  const reduced = useReducedMotion();
  const incoming = () => (props.items && props.items.length ? props.items : DEFAULT_ITEMS);
  const [list, setList] = createSignal<CircularCarouselItem[]>(untrack(incoming));
  const [leaving, setLeaving] = createSignal<Leaving | null>(null);
  const count = () => list().length;
  const shape = (): CircularCarouselPreset => (PRESETS[props.preset ?? 'cylinder'] ? (props.preset as CircularCarouselPreset) : 'cylinder');
  const layout = () => PRESETS[shape()];
  const axis = () => layout().axis;
  const tiltValue = () => props.tilt ?? layout().tilt;
  const curveValue = () => (layout().billboard ? 0 : clamp(props.curve ?? layout().curve, 0, 1));

  const cardW = () => Math.max(40, props.cardWidth ?? 220);
  const cardH = () => cardW() / clamp(props.aspectRatio ?? 1, 0.2, 5);
  const along = () => (axis() === 'x' ? cardH() : cardW());
  const step = () => 360 / count();

  const radius = createMemo(() => {
    const n = Math.max(count(), 3);
    const pitch = (along() + (props.gap ?? 25)) * layout().spread;
    const chord = pitch / (2 * Math.sin(Math.PI / n));
    const arc = (n * pitch) / (2 * Math.PI);
    return Math.max(chord + (arc - chord) * curveValue(), along() * 0.6);
  });

  const tiles = createMemo<Tile[]>(() => {
    const cv = curveValue();
    const total = cv > 0.001 ? TILES : 1;
    const length = along() / total;
    const bend = cv > 0.001 ? radius() / cv : 0;
    const lay = layout();
    const ax = axis();
    return Array.from({ length: total }, (_, index) => {
      const start = index * length - (index > 0 ? OVERLAP / 2 : 0);
      const end = (index + 1) * length + (index < total - 1 ? OVERLAP / 2 : 0);
      const center = (start + end) / 2 - along() / 2;
      const alpha = bend ? center / bend : 0;
      const shift = bend ? bend * Math.sin(alpha) : center;
      const sink = bend ? bend * (1 - Math.cos(alpha)) : 0;
      const depth = lay.inward ? sink : -sink;
      const turn = ((lay.inward ? -alpha : alpha) * 180) / Math.PI;
      const move =
        ax === 'x'
          ? `translate3d(0px, ${shift}px, ${depth}px) rotateX(${-turn}deg)`
          : `translate3d(${shift}px, 0px, ${depth}px) rotateY(${turn}deg)`;
      return { index, total, start, end, size: end - start, move };
    });
  });

  let root!: HTMLDivElement;
  let stage!: HTMLDivElement;
  let camera!: HTMLDivElement;
  let ring!: HTMLDivElement;
  const cardEls: (HTMLDivElement | null)[] = [];
  let wake: () => void = () => {};
  let measure: () => void = () => {};
  let activeNow = 0;
  const [active, setActive] = createSignal(0);
  const [ready, setReady] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);

  const state: CarouselState = {
    angle: 0,
    velocity: 0,
    target: null,
    dir: 0,
    press: null,
    drag: false,
    hover: false,
    pointer: { inside: false, x: 0, y: 0 },
    yaw: 0,
    pitch: 0,
    intro: null,
    introDone: false,
    holdUntil: 0,
    stepAt: 0,
    suppressClick: false,
    wheelTimer: undefined,
    fit: 1,
    shift: 0,
    drop: 0,
    last: 0
  };

  const buildSettings = (): Settings => ({
    count: count(),
    step: step(),
    radius: radius(),
    layout: layout(),
    axis: axis(),
    tilt: tiltValue(),
    perspective: layout().inward ? radius() : (props.perspective ?? layout().perspective),
    cardW: cardW(),
    cardH: cardH(),
    intro: reduced()
      ? 'none'
      : props.intro && props.intro in INTRO_LENGTH
        ? props.intro
        : 'rise',
    autoplay: reduced() ? 'off' : (props.autoplay ?? 'drift'),
    speed: props.speed ?? 14,
    interval: Math.max(0.5, props.interval ?? 3),
    draggable: props.draggable ?? true,
    momentum: clamp(props.momentum ?? 0.6, 0, 1),
    snap: props.snap ?? true,
    pauseOnHover: props.pauseOnHover ?? true,
    parallax: reduced() ? 0 : clamp(props.parallax ?? 0.3, 0, 1),
    stretch: reduced() ? 0 : clamp(props.stretch ?? 0.5, 0, 1),
    depthFade: clamp(props.depthFade ?? 0.55, 0, 1),
    captions: props.captions ?? false,
    reduced: reduced()
  });
  let S: Settings = buildSettings();

  const dragSign = () => (layout().inward ? -1 : 1);
  const directionSign = () => (props.direction === 'right' ? 1 : -1) * dragSign();

  // Upstream: effect on [directionSign].
  createEffect(() => {
    state.dir = directionSign();
    wake();
  });

  const itemsKey = createMemo(() => incoming().map(item => item.src).join('|'));

  // Upstream: effect on [sourcesKey] — preload, then swap or reveal.
  createEffect(() => {
    const key = itemsKey();
    void key;
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    untrack(() => {
      const next = incoming();
      const smooth = ready() && next.length === list().length;
      if (!smooth) {
        setReady(false);
        setLeaving(null);
        setList(next);
      }
      const sources = next.slice(0, 16).map(item => item.src);
      const load = (src: string) =>
        new Promise<void>(resolve => {
          const image = new Image();
          image.decoding = 'async';
          image.onload = () => {
            if (image.decode)
              image.decode().then(
                () => resolve(),
                () => resolve()
              );
            else resolve();
          };
          image.onerror = () => resolve();
          image.src = src;
        });
      const timeout = new Promise<void>(resolve => setTimeout(resolve, 2400));
      Promise.race([Promise.all(sources.map(load)), timeout]).then(() => {
        if (cancelled) return;
        if (smooth) {
          const previous = list();
          const s = S;
          if (!s.reduced && previous !== next) {
            setLeaving(current => ({
              id: (current?.id || 0) + 1,
              items: previous,
              delays: previous.map((_, index) => (Math.abs(wrap(index * s.step + state.angle)) / 180) * SWAP_SPREAD)
            }));
          }
          setList(next);
          wake();
          return;
        }
        state.introDone = false;
        state.intro = null;
        setReady(true);
        wake();
      });
    });
  });

  // Upstream: effect on [leaving] — clear the swap overlay.
  createEffect(() => {
    if (!leaving()) return;
    const timer = setTimeout(() => setLeaving(null), SWAP_LENGTH + SWAP_SPREAD + 80);
    onCleanup(() => clearTimeout(timer));
  });

  onMount(() => {
    let raf = 0;
    let visible = true;

    const nearest = (angle: number) => Math.round(angle / S.step) * S.step;

    measure = () => {
      const s = S;
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const room = s.captions ? CAPTION_SPACE : 0;
      const width = rect.width * 0.94;
      const height = (rect.height - room) * 0.92;
      const P = s.perspective;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      if (s.layout.inward) {
        minX = -width / 2;
        maxX = width / 2;
        minY = -s.cardH / 2;
        maxY = s.cardH / 2;
      } else {
        const corners: [number, number][] = [
          [-s.cardW / 2, -s.cardH / 2],
          [s.cardW / 2, -s.cardH / 2],
          [-s.cardW / 2, s.cardH / 2],
          [s.cardW / 2, s.cardH / 2]
        ];
        const limit = s.layout.window ? s.layout.window * s.step : 180;
        for (let a = -limit; a <= limit; a += limit / 24) {
          for (const [cx, cy] of corners) {
            let p: Vec3;
            if (s.axis === 'x') {
              p = rotateY(rotateX([cx, cy, s.radius], -a), s.tilt);
            } else if (s.layout.billboard) {
              const c = rotateY([0, 0, s.radius], a);
              p = rotateX([c[0] + cx, cy, c[2]], s.tilt);
            } else {
              p = rotateX(rotateY([cx, cy, s.radius], a), s.tilt);
            }
            p = [p[0], p[1], p[2] - s.radius];
            if (p[2] >= P * 0.95) continue;
            const k = P / (P - p[2]);
            minX = Math.min(minX, p[0] * k);
            maxX = Math.max(maxX, p[0] * k);
            minY = Math.min(minY, p[1] * k);
            maxY = Math.max(maxY, p[1] * k);
          }
        }
      }
      const spanX = Math.max(maxX - minX, 1);
      const spanY = Math.max(maxY - minY, 1);
      const fit = Math.min(1, width / spanX, height / spanY);
      state.fit = fit;
      state.shift = -((minY + maxY) / 2) * fit - room / 2;
      state.drop = s.axis === 'x' ? (rect.width / fit) * 0.55 + s.cardW : (rect.height / fit) * 0.55 + s.cardH;
      stage.style.perspective = `${P}px`;
      stage.style.transform = `translate3d(0, ${state.shift}px, 0) scale(${fit})`;
    };

    const introCard = (elapsed: number, landing: number): IntroPose => {
      if (!state.intro) return { radius: 1, lift: 0 };
      const type = state.intro.type;
      const reach = Math.abs(wrap(landing + state.angle));
      if (type === 'assemble') {
        const delay = (reach / 180) * 420;
        const p = easeOut(clamp((elapsed - delay) / 1080, 0, 1));
        return { radius: 1 + 0.6 * (1 - p), lift: 0 };
      }
      if (type === 'rise') {
        const delay = (reach / 180) * 480;
        const p = easeOutQuint(clamp((elapsed - delay) / 900, 0, 1));
        return { radius: 1, lift: (1 - p) * state.drop };
      }
      if (type === 'spin') {
        const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
        return { radius: 1 + 0.28 * (1 - p), lift: 0 };
      }
      return { radius: 1, lift: 0 };
    };

    const advance = (s: Settings, dt: number, now: number) => {
      if (!state.introDone && ready()) {
        if (!state.intro) {
          if (s.intro === 'none') state.introDone = true;
          else state.intro = { type: s.intro, start: now };
        }
        if (state.intro && now - state.intro.start >= INTRO_LENGTH[state.intro.type]) {
          state.intro = null;
          state.introDone = true;
        }
      }

      const paused = (s.pauseOnHover && state.hover) || state.drag || now < state.holdUntil;
      const cruise = s.autoplay === 'drift' && !paused && !state.intro ? s.speed * state.dir : 0;
      let busy = Boolean(state.intro) || state.drag;

      if (state.drag || state.intro) {
        state.velocity = state.drag ? state.velocity : 0;
      } else if (state.target !== null) {
        let remaining = dt;
        const damping = 2 * Math.sqrt(SPRING);
        while (remaining > 0) {
          const h = Math.min(remaining, 1 / 240);
          const accel = SPRING * (state.target - state.angle) - damping * state.velocity;
          state.velocity += accel * h;
          state.angle += state.velocity * h;
          remaining -= h;
        }
        if (Math.abs(state.target - state.angle) < 0.004 && Math.abs(state.velocity) < 0.03) {
          state.angle = state.target;
          state.velocity = 0;
          state.target = null;
        }
        busy = true;
      } else {
        const tau = 0.18 + s.momentum * 1.5;
        state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / tau));
        state.angle += state.velocity * dt;
        if (cruise === 0 && s.snap && Math.abs(state.velocity) < SETTLE_SPEED) {
          state.target = nearest(state.angle);
        }
        busy = busy || cruise !== 0 || Math.abs(state.velocity) > 0.01 || state.target !== null;
      }

      if (s.autoplay === 'step' && !paused && !state.intro && state.introDone) {
        if (!state.stepAt) state.stepAt = now + s.interval * 1000;
        if (now >= state.stepAt) {
          state.target = (state.target ?? nearest(state.angle)) + s.step * state.dir;
          state.stepAt = now + s.interval * 1000;
        }
        busy = true;
      } else {
        state.stepAt = 0;
      }

      if (now < state.holdUntil) busy = true;

      const ease = 1 - Math.exp(-dt / 0.35);
      const aimYaw = state.pointer.inside ? state.pointer.x * s.parallax * 9 : 0;
      const aimPitch = state.pointer.inside ? -state.pointer.y * s.parallax * 6 : 0;
      state.yaw += (aimYaw - state.yaw) * ease;
      state.pitch += (aimPitch - state.pitch) * ease;
      if (Math.abs(aimYaw - state.yaw) > 0.01 || Math.abs(aimPitch - state.pitch) > 0.01) busy = true;

      return busy;
    };

    const render = (s: Settings, now: number) => {
      const elapsed = state.intro ? now - state.intro.start : 0;
      const swell = 1 + s.stretch * 0.12 * Math.min(1, Math.abs(state.velocity) / 420);
      let spinOffset = 0;
      if (state.intro?.type === 'spin') {
        const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
        spinOffset = -300 * state.dir * (1 - p);
      } else if (state.intro?.type === 'assemble') {
        const p = easeOut(clamp(elapsed / INTRO_LENGTH.assemble, 0, 1));
        spinOffset = -32 * state.dir * (1 - p);
      }
      const angle = state.angle + spinOffset;
      const R = s.radius * swell;

      if (s.axis === 'x') {
        camera.style.transform = `translate3d(0, 0, ${-R}px) rotateY(${s.tilt + state.yaw}deg) rotateX(${state.pitch}deg)`;
        ring.style.transform = `rotateX(${-angle}deg)`;
      } else if (s.layout.inward) {
        camera.style.transform = `translate3d(0, 0, ${s.perspective - 1}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
        ring.style.transform = `rotateY(${angle}deg)`;
      } else {
        camera.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
        ring.style.transform = `rotateY(${angle}deg)`;
      }

      for (let index = 0; index < s.count; index++) {
        const card = cardEls[index];
        if (!card) continue;
        const base = index * s.step;
        const mod = introCard(elapsed, base);
        const r = R * mod.radius;
        let transform: string;
        if (s.axis === 'x') {
          transform = `rotateX(${-base}deg) translateZ(${r}px)`;
        } else if (s.layout.inward) {
          transform = `rotateY(${base}deg) translateZ(${-r}px)`;
        } else {
          transform = `rotateY(${base}deg) translateZ(${r}px)`;
          if (s.layout.billboard) transform += ` rotateY(${-(base + angle)}deg)`;
        }
        if (mod.lift) transform += s.axis === 'x' ? ` translateX(${mod.lift}px)` : ` translateY(${mod.lift}px)`;
        card.style.transform = transform;

        const world = wrap(base + angle);
        const facing = Math.cos(world * TO_RAD);
        if (s.layout.inward) card.style.visibility = Math.abs(world) > 86 ? 'hidden' : '';
        const fade = s.depthFade * Math.pow((1 - facing) / 2, 1.25);
        card.style.setProperty('--cc-depth', fade.toFixed(3));
      }

      const index = ((Math.round(-state.angle / s.step) % s.count) + s.count) % s.count || 0;
      if (index !== activeNow) {
        activeNow = index;
        setActive(index);
        untrack(() => props.onChange?.(index));
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const s = S;
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;
      state.last = now;
      const busy = advance(s, dt, now);
      render(s, now);
      if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        state.last = 0;
      } else wake();
    };

    const resize = new ResizeObserver(() => {
      measure();
      wake();
    });
    resize.observe(root);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
        state.last = 0;
      }
    });
    io.observe(root);

    const onWheel = (event: WheelEvent) => {
      const s = S;
      if (!s.draggable) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
      if (!delta) return;
      event.preventDefault();
      const perPixel = 180 / (Math.PI * s.radius * state.fit);
      state.target = null;
      state.angle -= delta * perPixel * (s.layout.inward ? -1 : 1);
      state.velocity = -delta * perPixel * (s.layout.inward ? -1 : 1) * 30;
      state.holdUntil = performance.now() + 1600;
      clearTimeout(state.wheelTimer);
      state.wheelTimer = setTimeout(() => {
        if (S.snap) state.target = nearest(state.angle + state.velocity * 0.12);
        wake();
      }, 140);
      wake();
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('visibilitychange', onVisibility);

    measure();
    render(S, performance.now());
    wake();

    onCleanup(() => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      io.disconnect();
      clearTimeout(state.wheelTimer);
      root.removeEventListener('wheel', onWheel);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  });

  // Upstream: layout effect on [radius, cardW, cardH, tiltValue, perspective,
  // preset, captions, count] + every-render wake — combined: refresh settings,
  // re-measure and wake whenever any prop changes.
  createEffect(() => {
    S = buildSettings();
    untrack(() => {
      measure();
      wake();
    });
  });

  const focusIndex = (index: number) => {
    const s = S;
    let target = -index * s.step;
    target += 360 * Math.round((state.angle - target) / 360);
    state.target = target;
    state.holdUntil = performance.now() + 2800;
    wake();
  };

  const stepBy = (delta: number) => {
    const s = S;
    const base = state.target ?? Math.round(state.angle / s.step) * s.step;
    state.target = base - delta * s.step * (s.layout.inward ? -1 : 1);
    state.holdUntil = performance.now() + 2800;
    wake();
  };

  const updatePointer = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    const pointer = state.pointer;
    pointer.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointer.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
  };

  const handlePointerDown = (event: PointerEvent) => {
    state.suppressClick = false;
    if (!props.draggable || event.button !== 0) return;
    state.press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      angle: state.angle,
      moved: false,
      origin: 0,
      samples: [{ time: performance.now(), angle: state.angle }]
    };
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') {
      state.pointer.inside = true;
      updatePointer(event);
    }
    const press = state.press;
    if (!press || press.id !== event.pointerId) {
      wake();
      return;
    }
    const s = S;
    const delta = s.axis === 'x' ? event.clientY - press.y : event.clientX - press.x;
    const cross = s.axis === 'x' ? event.clientX - press.x : event.clientY - press.y;
    if (!press.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      if (Math.abs(cross) > Math.abs(delta) * 1.2 && event.pointerType !== 'mouse') {
        state.press = null;
        return;
      }
      press.moved = true;
      press.origin = delta;
      state.drag = true;
      state.target = null;
      state.velocity = 0;
      setDragging(true);
      try {
        root.setPointerCapture(event.pointerId);
      } catch {}
    }
    const perPixel = 180 / (Math.PI * s.radius * state.fit);
    state.angle = press.angle + (delta - press.origin) * perPixel * (s.layout.inward ? -1 : 1);
    const now = performance.now();
    press.samples.push({ time: now, angle: state.angle });
    while (press.samples.length > 2 && now - press.samples[0].time > 110) press.samples.shift();
    wake();
  };

  const releasePointer = (event: PointerEvent) => {
    const press = state.press;
    if (!press || press.id !== event.pointerId) return;
    state.press = null;
    if (!press.moved) return;
    state.drag = false;
    setDragging(false);
    state.suppressClick = true;
    const s = S;
    const first = press.samples[0];
    const last = press.samples[press.samples.length - 1];
    const span = (last.time - first.time) / 1000;
    const velocity = span > 0.008 ? clamp((last.angle - first.angle) / span, -1400, 1400) : 0;
    state.velocity = velocity;
    if (Math.abs(velocity) > 60) state.dir = Math.sign(velocity);
    const coasting = s.autoplay === 'drift' && !(s.pauseOnHover && state.hover && event.pointerType === 'mouse');
    if (s.snap && !coasting) {
      const tau = 0.18 + s.momentum * 1.5;
      state.target = Math.round((state.angle + velocity * tau * 0.55) / s.step) * s.step;
    }
    wake();
  };

  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    state.hover = true;
    wake();
  };

  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') {
      state.hover = false;
      state.pointer.inside = false;
    }
    wake();
  };

  const handleClick = (event: MouseEvent) => {
    if (state.suppressClick) {
      state.suppressClick = false;
      return;
    }
    const card = (event.target as HTMLElement).closest?.('[data-cc-index]');
    if (!card) return;
    const index = Number(card.getAttribute('data-cc-index'));
    if (props.focusOnClick) focusIndex(index);
    untrack(() => props.onItemClick?.(list()[index], index));
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const forward = axis() === 'x' ? 'ArrowDown' : 'ArrowRight';
    const backward = axis() === 'x' ? 'ArrowUp' : 'ArrowLeft';
    if (event.key === forward) stepBy(1);
    else if (event.key === backward) stepBy(-1);
    else if (event.key === 'Home') focusIndex(0);
    else if (event.key === 'End') focusIndex(count() - 1);
    else if (event.key === 'Enter' || event.key === ' ')
      untrack(() => props.onItemClick?.(list()[activeNow], activeNow));
    else return;
    event.preventDefault();
  };

  const current = () => list()[active()] || list()[0];
  const label = () => (current() ? current()?.title || current()?.alt || `Image ${active() + 1}` : '');

  const renderTile = (item: CircularCarouselItem, tile: Tile, back: boolean, index: number) => {
    const strip = back ? tile.total - 1 - tile.index : tile.index;
    const first = strip === 0;
    const last = strip === tile.total - 1;
    const r = 'var(--cc-radius)';
    const frameRadius =
      axis() === 'x'
        ? `${first ? r : 0} ${first ? r : 0} ${last ? r : 0} ${last ? r : 0}`
        : `${first ? r : 0} ${last ? r : 0} ${last ? r : 0} ${first ? r : 0}`;
    const offset = back ? along() - tile.end : tile.start;
    const size = tile.size;
    const box: JSX.CSSProperties =
      axis() === 'x'
        ? { left: `${-cardW() / 2}px`, top: `${-size / 2}px`, width: `${cardW()}px`, height: `${size}px` }
        : { left: `${-size / 2}px`, top: `${-cardH() / 2}px`, width: `${size}px`, height: `${cardH()}px` };
    const photoStyle: JSX.CSSProperties =
      axis() === 'x'
        ? { left: '0', top: `${-offset}px`, width: `${cardW()}px`, height: `${cardH()}px` }
        : { left: `${-offset}px`, top: '0', width: `${cardW()}px`, height: `${cardH()}px` };
    const flip = axis() === 'x' ? ' rotateX(180deg)' : ' rotateY(180deg)';
    const gone = leaving()?.items[index];
    const leaveDelay = leaving()?.delays[index] ?? 0;
    return (
      <div
        class="absolute [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [outline:1px_solid_transparent]"
        style={{ ...box, transform: `${tile.move}${back ? flip : ''}` }}
        aria-hidden="true"
      >
        <div
          class="absolute left-0 top-0 w-full overflow-hidden"
          style={{ height: axis() === 'x' ? `${size}px` : `${cardH()}px`, 'border-radius': frameRadius }}
        >
          <img
            class="pointer-events-none absolute block max-w-none select-none object-cover [-webkit-user-drag:none]"
            src={item.src}
            alt=""
            draggable={false}
            decoding="async"
            style={photoStyle}
          />
          {gone && (
            <img
              class="pointer-events-none absolute block max-w-none select-none object-cover [-webkit-user-drag:none] animate-[circular-carousel-leave_700ms_cubic-bezier(0.33,1,0.68,1)_both]"
              src={gone.src}
              alt=""
              draggable={false}
              decoding="async"
              style={{ ...photoStyle, 'animation-delay': `${Math.round(leaveDelay)}ms` }}
            />
          )}
          {back && <div class="pointer-events-none absolute inset-0 bg-black opacity-[var(--cc-inner)]" />}
          <div class="pointer-events-none absolute inset-0 bg-[var(--cc-fade)] opacity-[var(--cc-depth,0)]" />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={root}
      class={`group/cc relative h-full w-full touch-pan-y select-none overflow-hidden outline-none [-webkit-tap-highlight-color:transparent] focus-visible:shadow-[inset_0_0_0_2px_rgba(128,128,140,0.55)] data-[axis=x]:touch-pan-x data-[draggable]:cursor-grab data-[dragging]:cursor-grabbing ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={
        {
          ...props.style,
          '--cc-fade': props.fadeColor ?? '#000000',
          '--cc-radius': `${Math.max(0, props.cornerRadius ?? 12)}px`,
          '--cc-inner': (1 - clamp(props.innerShade ?? 0.6, 0, 1)).toFixed(3)
        } as JSX.CSSProperties
      }
      role="region"
      aria-roledescription="carousel"
      aria-label="Image carousel"
      tabIndex={0}
      data-axis={axis()}
      data-shape={shape()}
      data-ready={ready() ? '' : undefined}
      data-draggable={props.draggable ? '' : undefined}
      data-dragging={dragging() ? '' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={releasePointer}
      onPointerCancel={releasePointer}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div
        class="absolute inset-0"
        style={
          MASKS[shape()]
            ? ({
                'mask-image': MASKS[shape()],
                '-webkit-mask-image': MASKS[shape()]
              } as JSX.CSSProperties)
            : undefined
        }
      >
        <div
          ref={stage}
          class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-[450ms] ease-[ease] group-data-[ready]/cc:opacity-100 motion-reduce:transition-none"
        >
          <div ref={camera} class="relative h-0 w-0 [transform-style:preserve-3d]">
            <div ref={ring} class="absolute left-0 top-0 h-0 w-0 [transform-style:preserve-3d]">
              <Index each={list()}>
                {(item, index) => (
                  <div
                    ref={element => {
                      cardEls[index] = element;
                    }}
                    class="absolute left-0 top-0 h-0 w-0 [transform-style:preserve-3d]"
                    data-cc-index={index}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${item().title || item().alt || `Image ${index + 1}`}, ${index + 1} of ${count()}`}
                  >
                    <For each={tiles()}>{tile => renderTile(item(), tile, false, index)}</For>
                    <Show when={layout().backfaces}>
                      <For each={tiles()}>{tile => renderTile(item(), tile, true, index)}</For>
                    </Show>
                  </div>
                )}
              </Index>
            </div>
          </div>
        </div>
      </div>
      <Show when={props.captions && current()}>
        <div
          class="pointer-events-none absolute inset-x-0 bottom-[22px] flex flex-col items-center gap-1.5 px-4 text-center animate-[circular-carousel-reveal_900ms_ease_both] motion-reduce:animate-none"
          aria-hidden="true"
        >
          <Show when={active()} keyed>
            {() => (
              <span class="flex max-w-full flex-col items-center text-[15px] font-medium leading-[1.35] animate-[circular-carousel-title_520ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none">
                {current()?.title || current()?.alt}
                {current()?.subtitle && <span class="font-normal opacity-60">{current()?.subtitle}</span>}
              </span>
            )}
          </Show>
          <span class="inline-flex items-center gap-[3px] text-[12px] leading-none tabular-nums opacity-50">
            <Digits value={active() + 1} />
            <span class="opacity-60">/</span>
            <span>{String(count()).padStart(2, '0')}</span>
          </span>
        </div>
      </Show>
      <style>{STYLE}</style>
      <div class="sr-only" aria-live="polite" aria-atomic="true">
        {`${label()}, ${active() + 1} of ${count()}`}
      </div>
    </div>
  );
};

export default CircularCarousel;
