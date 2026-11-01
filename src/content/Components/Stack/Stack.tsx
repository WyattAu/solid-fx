import { createEffect, createSignal, For, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import type { MotionValue, ValueAnimationTransition } from 'motion';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

type Layout = 'fan' | 'cascade' | 'deck' | 'pile';
type Vector = [number, number];
type Sample = [number, number, number];
type SpringKind = 'place' | 'settle' | 'tuck' | 'face' | 'lean' | 'press' | 'fling';

interface PlaceOptions {
  delay?: number;
  lift?: number;
  kind?: SpringKind;
  velocity?: Vector | null;
  keepZ?: boolean;
}

interface PlaceAllOptions {
  stagger?: number;
  lift?: number;
  released?: number;
  velocity?: Vector | null;
  kind?: SpringKind;
}

export interface StackProps {
  cards?: JSX.Element[];
  layout?: Layout;
  visible?: number;
  spread?: number;
  depth?: number;
  radius?: number;
  frame?: number;
  frameColor?: string;
  shadow?: boolean;
  tilt?: number;
  threshold?: number;
  speed?: number;
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  onChange?: (index: number) => void;
  className?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

interface Placement {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

interface CardValues {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
  spin: MotionValue<number>;
  lift: MotionValue<number>;
  grabX: MotionValue<number>;
  grabY: MotionValue<number>;
  z: MotionValue<number>;
  opacity: MotionValue<number>;
  shade: MotionValue<number>;
}

interface Settings {
  layout: Layout;
  visible: number;
  spread: number;
  depth: number;
  tilt: number;
  threshold: number;
  speed: number;
  sendToBackOnClick: boolean;
  count: number;
  reduceMotion: boolean;
}

interface DragState {
  card: number;
  id: number;
  element: HTMLDivElement;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  idle: ReturnType<typeof setTimeout> | 0;
  moved: boolean;
  progress: number;
  capture?: boolean;
  samples: Sample[];
}

interface Actions {
  placeAll: (options?: PlaceAllOptions) => void;
  sendToBack: (direction: Vector | null, velocity?: Vector | null) => void;
  onMove: (event: PointerEvent) => void;
  onUp: (event: PointerEvent) => void;
}

interface Listeners {
  move: (event: PointerEvent) => void;
  up: (event: PointerEvent) => void;
}

const DEFAULT_IMAGES = [
  'https://picsum.photos/seed/stack-1/500/500',
  'https://picsum.photos/seed/stack-2/500/500',
  'https://picsum.photos/seed/stack-3/500/500',
  'https://picsum.photos/seed/stack-4/500/500'
];

const ORIGINS: Record<Layout, Vector> = { fan: [0.9, 0.9], cascade: [0.5, 0.5], deck: [0.5, 0], pile: [0.5, 0.5] };
const EXITS: Partial<Record<Layout, Vector>> = { fan: [1, -0.3], cascade: [0.8, 0.6], deck: [0, 1] };
const SHADOW = '0 14px 34px -10px rgba(0, 0, 0, 0.45), 0 3px 8px -2px rgba(0, 0, 0, 0.18)';
const CLICK_SLOP = 6;
const FLICK_SPEED = 650;
const LEAN_SPEED = 1300;
const LEAN_REACH = 260;
const PRESS_SCALE = 1.035;
const SPRINGS: Record<SpringKind, Vector> = {
  place: [260, 24],
  settle: [320, 34],
  tuck: [240, 28],
  face: [240, 30],
  lean: [240, 28],
  press: [420, 34],
  fling: [650, 42]
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const noise = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const placement = (layout: Layout, position: number, card: number, spread: number, depth: number): Placement => {
  if (layout === 'cascade') {
    return { x: -position * spread * 28, y: -position * spread * 28, rotate: 0, scale: 1 - position * depth * 0.07 };
  }
  if (layout === 'deck') {
    return { x: 0, y: -position * spread * 32, rotate: 0, scale: 1 - position * depth * 0.1 };
  }
  if (layout === 'pile') {
    return {
      x: (noise(card + 1) - 0.5) * spread * 56,
      y: (noise(card + 2) - 0.5) * spread * 44,
      rotate: (noise(card + 3) - 0.5) * spread * 40,
      scale: 1 - position * depth * 0.03
    };
  }
  return { x: 0, y: 0, rotate: position * spread * 8, scale: 1 - position * depth * 0.12 };
};

const releaseVelocity = (samples: Sample[], time: number): Vector => {
  const recent = samples.filter(sample => time - sample[2] <= 100);
  if (recent.length < 2) return [0, 0];
  const first = recent[0];
  const last = recent[recent.length - 1];
  const elapsed = Math.max((last[2] - first[2]) / 1000, 0.008);
  return [(last[0] - first[0]) / elapsed, (last[1] - first[1]) / elapsed];
};

export default function Stack(props: StackProps) {
  // Upstream rendered default <img> children when no cards were supplied.
  const DEFAULT_ITEMS = DEFAULT_IMAGES.map(
    (src, index) => (
      <img src={src} alt={`Card ${index + 1}`} draggable={false} />
    )
  );
  const items = () => (props.cards && props.cards.length ? props.cards : DEFAULT_ITEMS);
  const count = () => items().length;
  const shape = (): Layout => ((props.layout ?? 'fan') in ORIGINS ? (props.layout as Layout) : 'fan');
  const reduceMotion = usePrefersReducedMotion();

  let rootRef!: HTMLDivElement;
  const [order, setOrder] = createSignal(Array.from({ length: count() }, (_, index) => index));
  const [dragging, setDragging] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  let orderRef = order();
  const valuesMap = new Map<number, CardValues>();
  const elementsRef = new Map<number, HTMLDivElement>();
  const innerElsRef = new Map<number, HTMLDivElement>();
  const shadeElsRef = new Map<number, HTMLDivElement>();
  const flyingRef = new Map<number, { turned: boolean }>();
  let dragRef: DragState | null = null;
  let aliveRef = true;
  let mountedRef = false;
  let actions: Actions;
  const listeners: Listeners = {
    move: (event: PointerEvent) => actions.onMove(event),
    up: (event: PointerEvent) => actions.onUp(event)
  };

  const computeSettings = (): Settings => ({
    layout: shape(),
    visible: clamp(Math.round(props.visible ?? 4), 1, Math.max(count(), 1)),
    spread: clamp(props.spread ?? 0.5, 0, 2),
    depth: clamp(props.depth ?? 0.5, 0, 1),
    tilt: clamp(props.tilt ?? 30, 0, 89),
    threshold: Math.max(props.threshold ?? 90, 0),
    speed: clamp(props.speed ?? 1, 0.2, 4),
    sendToBackOnClick: props.sendToBackOnClick ?? false,
    count: count(),
    reduceMotion: !!reduceMotion()
  });

  let settingsRef: Settings = computeSettings();

  const writeCard = (index: number) => {
    const el = elementsRef.get(index);
    if (!el) return;
    const values = valuesMap.get(index);
    if (!values) return;
    const [ox, oy] = ORIGINS[settingsRef.layout] ?? ORIGINS.fan;
    el.style.transform = `translate3d(${values.x.get()}px, ${values.y.get()}px, 0) rotate(${values.rotate.get()}deg) scale(${values.scale.get()})`;
    el.style.transformOrigin = `${ox * 100}% ${oy * 100}%`;
    el.style.zIndex = String(Math.round(values.z.get()));
    el.style.opacity = String(values.opacity.get());
    const inner = innerElsRef.get(index);
    if (inner) {
      inner.style.transform = `perspective(800px) rotateX(${values.tiltX.get()}deg) rotateY(${values.tiltY.get()}deg) rotate(${values.spin.get()}deg) scale(${values.lift.get()})`;
      inner.style.transformOrigin = `${values.grabX.get() * 100}% ${values.grabY.get() * 100}%`;
    }
    const shade = shadeElsRef.get(index);
    if (shade) shade.style.opacity = String(values.shade.get());
  };

  const valuesFor = (index: number): CardValues => {
    let values = valuesMap.get(index);
    if (!values) {
      const s = settingsRef;
      const position = Math.max(0, orderRef.indexOf(index));
      const start = placement(s.layout, s.reduceMotion ? Math.min(position, s.visible - 1) : 0, index, s.spread, s.depth);
      values = {
        x: motionValue(start.x),
        y: motionValue(start.y),
        rotate: motionValue(start.rotate),
        scale: motionValue(start.scale),
        tiltX: motionValue(0),
        tiltY: motionValue(0),
        spin: motionValue(0),
        lift: motionValue(1),
        grabX: motionValue(0.5),
        grabY: motionValue(0.5),
        z: motionValue(s.count - position),
        opacity: motionValue(position < s.visible ? 1 : 0),
        shade: motionValue(0)
      };
      for (const value of Object.values(values)) value.on('change', () => writeCard(index));
      valuesMap.set(index, values);
    }
    return values;
  };

  const springFor = (s: Settings, kind: SpringKind, extra: ValueAnimationTransition<number> = {}): ValueAnimationTransition<number> => {
    if (s.reduceMotion) return { duration: 0.2, ease: 'easeOut', delay: extra.delay || 0 };
    const [stiffness, damping] = SPRINGS[kind];
    return {
      type: 'spring',
      stiffness: stiffness * s.speed * s.speed,
      damping: damping * s.speed,
      restDelta: 0.01,
      restSpeed: 0.5,
      ...extra
    };
  };

  const settleFace = (values: CardValues, s: Settings, delay = 0) => {
    const transition = springFor(s, 'face', { delay });
    animate(values.tiltX, 0, transition);
    animate(values.tiltY, 0, transition);
    animate(values.spin, 0, transition);
    animate(values.lift, 1, transition);
  };

  const placeCard = (
    index: number,
    position: number,
    { delay = 0, lift = 0, kind = 'place', velocity = null, keepZ = false }: PlaceOptions = {}
  ) => {
    const s = settingsRef;
    const values = valuesFor(index);
    const shown = Math.min(position, s.visible - 1);
    const target = placement(s.layout, shown, index, s.spread, s.depth);
    if (lift > 0 && shown > 0) {
      const ahead = placement(s.layout, shown - 1, index, s.spread, s.depth);
      target.x = mix(target.x, ahead.x, lift);
      target.y = mix(target.y, ahead.y, lift);
      target.rotate = mix(target.rotate, ahead.rotate, lift);
      target.scale = mix(target.scale, ahead.scale, lift);
    }
    const motionSpring = springFor(s, kind, { delay });
    const fade: ValueAnimationTransition<number> = {
      duration: s.reduceMotion ? 0.2 : 0.35 / s.speed,
      ease: 'easeOut',
      delay
    };
    if (!keepZ) values.z.set(s.count - position);
    animate(values.x, target.x, velocity ? { ...motionSpring, velocity: velocity[0] } : motionSpring);
    animate(values.y, target.y, velocity ? { ...motionSpring, velocity: velocity[1] } : motionSpring);
    animate(values.rotate, target.rotate, motionSpring);
    animate(values.scale, target.scale, motionSpring);
    settleFace(values, s, delay);
    animate(values.opacity, position < s.visible ? 1 : 0, fade);
    animate(values.shade, Math.min(0.6, shown * s.depth * 0.14 * (1 - lift)), fade);
  };

  const placeAll = ({ stagger = 0, lift = 0, released = -1, velocity = null, kind = 'place' }: PlaceAllOptions = {}) => {
    const drag = dragRef;
    orderRef.forEach((index, position) => {
      const flight = flyingRef.get(index);
      if (flight && !flight.turned) return;
      if (drag && drag.moved && drag.card === index) return;
      const isReleased = index === released;
      placeCard(index, position, {
        delay: position * stagger,
        lift: position > 0 ? lift : 0,
        kind: flight ? 'tuck' : isReleased ? 'settle' : kind,
        velocity: isReleased ? velocity : null,
        keepZ: !!flight
      });
    });
  };

  const commit = (next: number[]) => {
    orderRef = next;
    setOrder(next);
  };

  const sendToBack = (direction: Vector | null, velocity: Vector | null = null) => {
    const s = settingsRef;
    const current = orderRef;
    if (current.length < 2) return;
    const top = current[0];
    if (flyingRef.has(top)) return;
    const next = [...current.slice(1), top];
    if (s.reduceMotion) {
      commit(next);
      return;
    }
    let [dx, dy] = direction || EXITS[s.layout] || [Math.cos(noise(top + 9) * 6.283), Math.sin(noise(top + 9) * 6.283)];
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    const bounds = rootRef?.getBoundingClientRect();
    const width = bounds?.width || 240;
    const height = bounds?.height || 240;
    const clearance = Math.min(width / Math.max(Math.abs(dx), 0.01), height / Math.max(Math.abs(dy), 0.01));
    const home = placement(s.layout, 0, top, s.spread, s.depth);
    const travel = clearance * 1.12 + 40;
    const out = [home.x + dx * travel, home.y + dy * travel];
    const values = valuesFor(top);
    const launch = springFor(s, 'fling');
    const flight = { turned: false };
    flyingRef.set(top, flight);
    values.z.set(s.count + 1);
    animate(values.x, out[0], velocity ? { ...launch, velocity: velocity[0] } : launch);
    animate(values.y, out[1], velocity ? { ...launch, velocity: velocity[1] } : launch);
    settleFace(values, s);
    commit(next);
    const span = Math.max(Math.hypot(out[0] - values.x.get(), out[1] - values.y.get()), 1);
    let landed = false;
    const turn = () => {
      flight.turned = true;
      const position = orderRef.indexOf(top);
      if (position >= 0) placeCard(top, position, { kind: 'tuck', keepZ: !landed });
    };
    const land = () => {
      landed = true;
      if (flyingRef.get(top) === flight) flyingRef.delete(top);
      const position = orderRef.indexOf(top);
      if (position >= 0) values.z.set(settingsRef.count - position);
    };
    const fallback = setTimeout(() => {
      if (!flight.turned) turn();
      if (!landed) land();
    }, 1500 / s.speed);
    const clearOfPile = () => {
      const element = elementsRef.get(top);
      if (!element) return true;
      const mine = element.getBoundingClientRect();
      for (const [index, other] of elementsRef) {
        if (index === top || flyingRef.has(index) || valuesFor(index).opacity.get() < 0.5) continue;
        const box = other.getBoundingClientRect();
        if (mine.left < box.right && mine.right > box.left && mine.top < box.bottom && mine.bottom > box.top) {
          return false;
        }
      }
      return true;
    };
    const watch = () => {
      if (!aliveRef || (flight.turned && landed)) {
        clearTimeout(fallback);
        return;
      }
      const x = values.x.get();
      const y = values.y.get();
      const outward = values.x.getVelocity() * dx + values.y.getVelocity() * dy;
      if (!flight.turned && (Math.hypot(out[0] - x, out[1] - y) <= span * 0.06 || outward < 0)) turn();
      if (!landed && (clearOfPile() || (flight.turned && outward < 0))) land();
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  };

  const lean = (drag: DragState) => {
    const s = settingsRef;
    if (s.reduceMotion) return;
    const values = valuesFor(drag.card);
    const offsetX = values.x.get() - drag.homeX;
    const offsetY = values.y.get() - drag.homeY;
    const sideways = clamp(drag.vx / LEAN_SPEED, -1, 1) * 0.7 + clamp(offsetX / LEAN_REACH, -1, 1) * 0.3;
    const upward = clamp(-drag.vy / LEAN_SPEED, -1, 1) * 0.7 + clamp(-offsetY / LEAN_REACH, -1, 1) * 0.3;
    const follow = springFor(s, 'lean');
    animate(values.tiltY, sideways * s.tilt, follow);
    animate(values.tiltX, upward * s.tilt, follow);
    animate(values.spin, clamp(offsetX / LEAN_REACH, -1, 1) * 6, follow);
  };

  const onMove = (event: PointerEvent) => {
    const drag = dragRef;
    if (!drag || event.pointerId !== drag.id) return;
    const s = settingsRef;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const values = valuesFor(drag.card);
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < CLICK_SLOP) return;
      drag.moved = true;
      values.x.stop();
      values.y.stop();
      drag.originX = values.x.get() - dx;
      drag.originY = values.y.get() - dy;
      try {
        drag.element.setPointerCapture(drag.id);
      } catch {
        drag.capture = false;
      }
      setDragging(true);
    }
    values.x.set(drag.originX + dx);
    values.y.set(drag.originY + dy);
    drag.samples.push([event.clientX, event.clientY, event.timeStamp]);
    if (drag.samples.length > 12) drag.samples.shift();
    [drag.vx, drag.vy] = releaseVelocity(drag.samples, event.timeStamp);
    lean(drag);
    clearTimeout(drag.idle);
    drag.idle = setTimeout(() => {
      if (dragRef !== drag) return;
      drag.vx = 0;
      drag.vy = 0;
      lean(drag);
    }, 70);
    const progress = clamp(Math.hypot(dx, dy) / Math.max(s.threshold, 1), 0, 1);
    if (Math.abs(progress - drag.progress) > 0.02) {
      drag.progress = progress;
      placeAll({ lift: progress * 0.4, kind: 'settle' });
    }
  };

  const onUp = (event: PointerEvent) => {
    const drag = dragRef;
    if (!drag || event.pointerId !== drag.id) return;
    dragRef = null;
    clearTimeout(drag.idle);
    window.removeEventListener('pointermove', listeners.move);
    window.removeEventListener('pointerup', listeners.up);
    window.removeEventListener('pointercancel', listeners.up);
    try {
      drag.element.releasePointerCapture(drag.id);
    } catch {
      drag.capture = false;
    }
    const s = settingsRef;
    if (!drag.moved) {
      if (event.type === 'pointerup' && s.sendToBackOnClick) sendToBack(null);
      else settleFace(valuesFor(drag.card), s);
      return;
    }
    setDragging(false);
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const [vx, vy] = releaseVelocity(drag.samples, event.timeStamp);
    const distance = Math.hypot(dx, dy);
    const pace = Math.hypot(vx, vy);
    const flick = pace > FLICK_SPEED && distance > 16 && vx * dx + vy * dy > 0;
    if (event.type === 'pointerup' && s.count > 1 && (distance > s.threshold || flick)) {
      sendToBack(pace > 300 ? [vx, vy] : [dx, dy], [vx, vy]);
    } else {
      placeAll({ released: drag.card, velocity: [clamp(vx, -3000, 3000), clamp(vy, -3000, 3000)] });
    }
  };

  const onDown = (event: PointerEvent, index: number) => {
    if (event.button !== 0 || dragRef) return;
    if (orderRef[0] !== index || flyingRef.has(index)) return;
    const s = settingsRef;
    const values = valuesFor(index);
    const home = placement(s.layout, 0, index, s.spread, s.depth);
    const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    values.grabX.set(clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1));
    values.grabY.set(clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1));
    if (!s.reduceMotion) animate(values.lift, PRESS_SCALE, springFor(s, 'press'));
    dragRef = {
      card: index,
      id: event.pointerId,
      element: event.currentTarget as HTMLDivElement,
      startX: event.clientX,
      startY: event.clientY,
      originX: 0,
      originY: 0,
      homeX: home.x,
      homeY: home.y,
      vx: 0,
      vy: 0,
      idle: 0,
      moved: false,
      progress: 0,
      samples: [[event.clientX, event.clientY, event.timeStamp]]
    };
    if (event.pointerType === 'mouse') event.preventDefault();
    window.addEventListener('pointermove', listeners.move);
    window.addEventListener('pointerup', listeners.up);
    window.addEventListener('pointercancel', listeners.up);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      sendToBack(null);
    }
  };

  actions = { placeAll, sendToBack, onMove, onUp };

  // Upstream computed settings during render (including the order fix-up).
  createEffect(() => {
    settingsRef = computeSettings();
    const currentOrder = order();
    const n = count();
    if (currentOrder.length !== n || currentOrder.some(index => index >= n)) {
      const next = currentOrder.filter(index => index < n);
      for (let index = 0; index < n; index++) if (!next.includes(index)) next.push(index);
      orderRef = next;
      setOrder(next);
    }
  });

  // Upstream deps: [order, shape, visible, spread, depth, speed, count]
  createEffect(() => {
    const currentOrder = order();
    void shape();
    void props.visible;
    void props.spread;
    void props.depth;
    void props.speed;
    void count();
    orderRef = currentOrder;
    placeAll({ stagger: mountedRef ? 0 : 0.06 });
    mountedRef = true;
  });

  let changed = false;
  createEffect(() => {
    // Upstream deps: [top] — skips the initial mount.
    const top = order()[0];
    if (!changed) {
      changed = true;
      return;
    }
    if (top !== undefined) untrack(() => props.onChange?.(top));
  });

  createEffect(() => {
    // Upstream deps: [autoplay, autoplayDelay, pauseOnHover, hovered, dragging, order, count]
    const autoplayOn = props.autoplay ?? false;
    void props.autoplayDelay;
    const pauseOnHover = props.pauseOnHover ?? false;
    const isHovered = hovered();
    const isDragging = dragging();
    void order();
    const n = count();
    if (!autoplayOn || n < 2 || isDragging || (pauseOnHover && isHovered)) return;
    const timer = setTimeout(() => sendToBack(null), Math.max(300, props.autoplayDelay ?? 3000));
    onCleanup(() => clearTimeout(timer));
  });

  onMount(() => {
    aliveRef = true;
    onCleanup(() => {
      aliveRef = false;
      if (dragRef) clearTimeout(dragRef.idle);
      window.removeEventListener('pointermove', listeners.move);
      window.removeEventListener('pointerup', listeners.up);
      window.removeEventListener('pointercancel', listeners.up);
      valuesMap.forEach(group => Object.values(group).forEach(value => value.stop()));
    });
  });

  const innerRadius = () => Math.max(0, (props.radius ?? 16) - (props.frame ?? 0));

  return (
    <div
      ref={rootRef}
      class={`group relative w-full h-full outline-none ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={props.style}
      tabIndex={0}
      role="group"
      aria-label="Card stack"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <For each={items()}>
        {(card, i) => {
          const index = i();
          valuesFor(index);
          const isTop = () => order()[0] === index;
          return (
            <div
              ref={(el: HTMLDivElement) => {
                elementsRef.set(index, el);
                writeCard(index);
                onCleanup(() => elementsRef.delete(index));
              }}
              class="absolute inset-0 will-change-transform select-none [-webkit-tap-highlight-color:transparent]"
              data-top={isTop() ? '' : undefined}
              aria-hidden={isTop() ? undefined : 'true'}
              style={{
                cursor: isTop() ? (dragging() ? 'grabbing' : 'grab') : 'default',
                'touch-action': isTop() ? 'pan-y' : 'auto'
              }}
              onPointerDown={(e: PointerEvent) => onDown(e, index)}
            >
              <div
                ref={(el: HTMLDivElement) => {
                  innerElsRef.set(index, el);
                  writeCard(index);
                  onCleanup(() => innerElsRef.delete(index));
                }}
                class={`absolute inset-0 overflow-hidden will-change-transform ${isTop() ? 'group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-current' : ''}`}
                style={{
                  'border-radius': `${props.radius ?? 16}px`,
                  padding: `${props.frame ?? 0}px`,
                  'background-color': (props.frame ?? 0) > 0 ? props.frameColor ?? '#ffffff' : 'transparent',
                  'box-shadow': (props.shadow ?? true) ? SHADOW : 'none'
                }}
              >
                <div
                  class="relative w-full h-full overflow-hidden [&_img]:block [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:pointer-events-none [&_img]:[-webkit-user-drag:none]"
                  style={{ 'border-radius': `${innerRadius()}px` }}
                >
                  {card}
                </div>
                <div
                  ref={(el: HTMLDivElement) => {
                    shadeElsRef.set(index, el);
                    writeCard(index);
                    onCleanup(() => shadeElsRef.delete(index));
                  }}
                  class="absolute inset-0 bg-black pointer-events-none"
                />
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
