// Component ported from https://codepen.io/JuanFuentes/full/rgXKGQ
import { createEffect, createMemo, createSignal, Index, onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';

type IdleMode = 'none' | 'wave' | 'pulse';

interface TextPressureProps {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  radius?: number;
  smoothing?: number;
  idle?: IdleMode;
  idleSpeed?: number;
  clickRipple?: boolean;
  textColor?: string;
  pressureColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
  class?: string;
  minFontSize?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Ripple extends Point {
  start: number;
}

interface PressureOptions {
  width: boolean;
  weight: boolean;
  italic: boolean;
  alpha: boolean;
  radius: number;
  smoothing: number;
  idle: IdleMode;
  idleSpeed: number;
  clickRipple: boolean;
  textColor: string;
  pressureColor: string;
}

interface AppliedStyle {
  span: HTMLSpanElement;
  settings: string;
  alphaVal: string;
  color: string;
}

const RIPPLE_LIFE = 1.3;
const MAX_RIPPLES = 6;
const WAVE_PERIOD = 3.2;
const PULSE_PERIOD = 2.8;
const PULSE_DEPTH = 0.42;

const dist = (a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getIdlePressure = (mode: IdleMode, position: number, clock: number, spread: number) => {
  if (mode === 'wave') {
    const crest = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (position / spread - clock / WAVE_PERIOD));
    return crest * crest;
  }
  if (mode === 'pulse') {
    const lag = Math.abs(position - 0.5) * 0.4;
    const breath = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (clock / PULSE_PERIOD - lag));
    return PULSE_DEPTH * breath * breath * (3 - 2 * breath);
  }
  return 0;
};

const getRipplePressure = (ripples: Ripple[], point: Point, now: number, span: number) => {
  const band = Math.max(span * 0.14, 32);
  let total = 0;
  for (const ripple of ripples) {
    const age = (now - ripple.start) / 1000;
    if (age <= 0 || age >= RIPPLE_LIFE) continue;
    const offset = (dist(ripple, point) - age * span * 1.25) / band;
    if (offset <= -1 || offset >= 1) continue;
    const fade = 1 - age / RIPPLE_LIFE;
    const swell = (1 - offset * offset) ** 2 * fade * fade * Math.min(1, age / 0.06);
    total = 1 - (1 - total) * (1 - swell);
  }
  return total;
};

const TextPressure = (props: TextPressureProps) => {
  const text = () => props.text ?? 'Compressa';
  const fontFamily = () => props.fontFamily ?? 'Roboto Flex';
  const fontUrl = () =>
    props.fontUrl ??
    'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap';
  const flex = () => props.flex ?? true;
  const stroke = () => props.stroke ?? false;
  const scale = () => props.scale ?? false;
  const textColor = () => props.textColor ?? 'currentColor';
  const strokeColor = () => props.strokeColor ?? '#FF0000';
  const strokeWidth = () => props.strokeWidth ?? 3;
  const minFontSize = () => props.minFontSize ?? 24;

  let container!: HTMLDivElement;
  let title!: HTMLHeadingElement;
  let spans: (HTMLSpanElement | null)[] = [];
  let wake: (() => void) | null = null;
  let visible = true;
  const ripples: Ripple[] = [];
  const options: PressureOptions = {
    width: props.width ?? true,
    weight: props.weight ?? true,
    italic: props.italic ?? true,
    alpha: props.alpha ?? false,
    radius: props.radius ?? 0.5,
    smoothing: props.smoothing ?? 0.5,
    idle: props.idle ?? 'none',
    idleSpeed: props.idleSpeed ?? 1,
    clickRipple: props.clickRipple ?? true,
    textColor: textColor(),
    pressureColor: props.pressureColor ?? ''
  };

  const mouse: Point = { x: 0, y: 0 };
  const cursor: Point & { seen: boolean } = { x: 0, y: 0, seen: false };

  const [fontSize, setFontSize] = createSignal(minFontSize());
  const [scaleY, setScaleY] = createSignal(1);

  const chars = createMemo(() => Array.from(text()));

  // Upstream: useEffect syncing optionsRef then waking the loop.
  createEffect(() => {
    options.width = props.width ?? true;
    options.weight = props.weight ?? true;
    options.italic = props.italic ?? true;
    options.alpha = props.alpha ?? false;
    options.radius = props.radius ?? 0.5;
    options.smoothing = props.smoothing ?? 0.5;
    options.idle = props.idle ?? 'none';
    options.idleSpeed = props.idleSpeed ?? 1;
    options.clickRipple = props.clickRipple ?? true;
    options.textColor = textColor();
    options.pressureColor = props.pressureColor ?? '';
    wake?.();
  });

  // Upstream: useEffect([]) attaching global listeners + IntersectionObserver.
  onMount(() => {
    const el = container;
    const track = (x: number, y: number) => {
      cursor.x = x;
      cursor.y = y;
      cursor.seen = true;
      wake?.();
    };
    const handleMouseMove = (e: MouseEvent) => track(e.clientX, e.clientY);
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) track(t.clientX, t.clientY);
    };
    const handleLeave = () => {
      cursor.seen = false;
      wake?.();
    };
    const handlePress = (e: PointerEvent) => {
      if (!options.clickRipple) return;
      ripples.push({ x: e.clientX, y: e.clientY, start: performance.now() });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
      wake?.();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', handleLeave);
    window.addEventListener('touchcancel', handleLeave);
    window.addEventListener('scroll', wakeListener, { passive: true, capture: true });
    document.documentElement.addEventListener('mouseleave', handleLeave);
    document.fonts?.addEventListener?.('loadingdone', wakeListener);
    el?.addEventListener('pointerdown', handlePress);

    if (el) {
      const { left, top, width, height } = el.getBoundingClientRect();
      mouse.x = left + width / 2;
      mouse.y = top + height / 2;
      cursor.x = mouse.x;
      cursor.y = mouse.y;
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (entry.isIntersecting) wake?.();
    });
    if (el) observer.observe(el);

    function wakeListener() {
      wake?.();
    }

    onCleanup(() => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleLeave);
      window.removeEventListener('touchcancel', handleLeave);
      window.removeEventListener('scroll', wakeListener, { capture: true });
      document.documentElement.removeEventListener('mouseleave', handleLeave);
      document.fonts?.removeEventListener?.('loadingdone', wakeListener);
      el?.removeEventListener('pointerdown', handlePress);
      observer.disconnect();
    });
  });

  // Upstream: isomorphic layout effect sizing the title via ResizeObserver.
  createEffect(() => {
    const count = chars().length;
    const min = minFontSize();
    const scaleOn = scale();
    const el = container;
    if (!el) return;

    const resize = () => {
      const { width: containerW, height: containerH } = el.getBoundingClientRect();
      const nextFontSize = Math.max(count ? containerW / (count / 2) : min, min);
      setFontSize(nextFontSize);
      setScaleY(scaleOn && containerH > 0 ? containerH / nextFontSize : 1);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  });

  // Upstream: useEffect([]) — the self-throttling pressure loop.
  onMount(() => {
    const containerEl = container;
    const titleEl = title;
    if (!containerEl || !titleEl) return;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const applied: AppliedStyle[] = [];
    let rafId = 0;
    let last = 0;
    let idleFrames = 0;
    let clock = 0;
    let engage = options.idle === 'wave' || options.idle === 'pulse' ? 0 : 1;

    const tick = (now: number) => {
      rafId = 0;
      const elapsed = last ? Math.min(now - last, 64) : 1000 / 60;
      last = now;

      const idleMode: IdleMode =
        (options.idle === 'wave' || options.idle === 'pulse') && !motionQuery?.matches ? options.idle : 'none';
      const lag = 1000 * options.smoothing * options.smoothing;
      const follow = lag > 1 ? 1 - Math.exp(-elapsed / lag) : 1;
      mouse.x += (cursor.x - mouse.x) * follow;
      mouse.y += (cursor.y - mouse.y) * follow;

      let present = 1;
      if (idleMode !== 'none') {
        const box = containerEl.getBoundingClientRect();
        const inside = cursor.x >= box.left && cursor.x <= box.right && cursor.y >= box.top && cursor.y <= box.bottom;
        present = cursor.seen && inside ? 1 : 0;
      }
      engage += (present - engage) * (1 - Math.exp(-elapsed / 320));
      if (Math.abs(present - engage) < 0.002) engage = present;
      const idling = idleMode !== 'none' && engage < 1;
      if (idling) clock += (elapsed / 1000) * options.idleSpeed;

      while (ripples.length && now - ripples[0].start > RIPPLE_LIFE * 1000) ripples.shift();

      const titleRect = titleEl.getBoundingClientRect();
      const maxDist = Math.max(titleRect.width * options.radius, 1);
      const spread = Math.max(options.radius * 2, 0.2);
      const centers = spans.map(span => {
        if (!span) return null;
        const rect = span.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      });

      let changed = false;
      spans.forEach((span, i) => {
        const center = centers[i];
        if (!span || !center) return;

        let pressure = clamp01(1 - dist(mouse, center) / maxDist);
        if (idling) {
          const position = (center.x - titleRect.left) / Math.max(titleRect.width, 1);
          const resting = getIdlePressure(idleMode, position, clock, spread);
          pressure = resting + (pressure - resting) * engage;
        }
        if (ripples.length) {
          const swell = getRipplePressure(ripples, center, now, titleRect.width);
          pressure = 1 - (1 - pressure) * (1 - swell);
        }

        const wdth = options.width ? Math.floor(5 + 200 * pressure) : 100;
        const wght = options.weight ? Math.floor(100 + 900 * pressure) : 400;
        const italVal = options.italic ? pressure.toFixed(2) : '0';
        const alphaVal = options.alpha ? pressure.toFixed(2) : '';
        const tint = Math.round((1 - (1 - pressure) * (1 - pressure)) * 100);
        const color = options.pressureColor
          ? `color-mix(in oklab, ${options.pressureColor} ${tint}%, ${options.textColor})`
          : '';
        const settings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
        const previous = applied[i];

        if (
          !previous ||
          previous.span !== span ||
          previous.settings !== settings ||
          previous.alphaVal !== alphaVal ||
          previous.color !== color
        ) {
          span.style.fontVariationSettings = settings;
          span.style.opacity = alphaVal;
          span.style.color = color;
          applied[i] = { span, settings, alphaVal, color };
          changed = true;
        }
      });

      const moving = Math.abs(cursor.x - mouse.x) > 0.1 || Math.abs(cursor.y - mouse.y) > 0.1;
      const animating = moving || idling || engage !== present || ripples.length > 0;
      idleFrames = animating ? 0 : idleFrames + 1;

      if (animating || (changed && idleFrames < 60)) rafId = requestAnimationFrame(tick);
      else last = 0;
    };

    wake = () => {
      if (!rafId && visible) rafId = requestAnimationFrame(tick);
    };

    wake();

    onCleanup(() => {
      cancelAnimationFrame(rafId);
      wake = null;
    });
  });

  // Upstream: useEffect([fontSize, scaleY, text, flex, fontFamily]) → wake.
  createEffect(() => {
    fontSize();
    scaleY();
    text();
    flex();
    fontFamily();
    wake?.();
  });

  return (
    <div ref={container} class="relative h-full w-full bg-transparent">
      <style>{`
        @import url('${fontUrl()}');

        .text-pressure-title.is-stroke span {
          position: relative;
        }

        .text-pressure-title.is-stroke span::after {
          content: attr(data-char);
          position: absolute;
          left: 0;
          top: 0;
          color: transparent;
          z-index: -1;
          -webkit-text-stroke-width: var(--text-pressure-stroke-width);
          -webkit-text-stroke-color: var(--text-pressure-stroke-color);
        }
      `}</style>
      <h1
        ref={title}
        aria-label={chars().join('')}
        class={`text-pressure-title m-0 w-full uppercase text-center whitespace-nowrap select-none ${flex() ? 'flex justify-between' : ''} ${stroke() ? 'is-stroke' : ''} ${props.class ?? ''} ${props.className ?? ''}`}
        style={{
          'font-family': fontFamily(),
          'font-size': `${fontSize()}px`,
          'line-height': 1,
          transform: `scale(1, ${scaleY()})`,
          'transform-origin': 'center top',
          'font-weight': 100,
          color: textColor(),
          '--text-pressure-stroke-width': `${strokeWidth()}px`,
          '--text-pressure-stroke-color': strokeColor()
        } as JSX.CSSProperties}
      >
        <Index each={chars()}>
          {(char, i) => (
            <span
              ref={el => {
                spans[i] = el;
                onCleanup(() => {
                  if (spans[i] === el) spans[i] = null;
                });
              }}
              data-char={char()}
              aria-hidden="true"
              class="inline-block"
            >
              {char()}
            </span>
          )}
        </Index>
      </h1>
    </div>
  );
};

export default TextPressure;
