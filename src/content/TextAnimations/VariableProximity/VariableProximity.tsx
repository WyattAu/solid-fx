import { createEffect, createMemo, createSignal, For, onCleanup, Show, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap');";

type Falloff = 'linear' | 'exponential' | 'gaussian';

interface VariableProximityProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'className' | 'style' | 'ref' | 'children' | 'onClick'> {
  label?: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  /** Upstream took a React RefObject for the pointer-bounds container; pass a plain `{ current }` box. */
  containerRef?: { current: HTMLElement | null };
  radius?: number;
  falloff?: Falloff;
  smoothing?: number;
  fromColor?: string;
  toColor?: string;
  scale?: number;
  lift?: number;
  idleWave?: boolean;
  fontSize?: number | string;
  class?: string;
  className?: string;
  onClick?: () => void;
  style?: JSX.CSSProperties;
  /** Upstream exposed forwardRef; pass a callback to receive the root span. */
  ref?: (el: HTMLSpanElement) => void;
}

interface ProximityState {
  pointer: { x: number; y: number; active: boolean };
  levels: number[];
  targets: number[];
}

const DEFAULT_FROM = "'wght' 400, 'opsz' 9";
const DEFAULT_TO = "'wght' 1000, 'opsz' 40";

const GAUSSIAN_EDGE = Math.exp(-2);
const WAVE_PERIOD = 3.2;
const WAVE_PEAK = 0.7;

const parseSettings = (settings: string) =>
  new Map(
    settings
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [name, value] = part.split(/\s+/);
        return [name.replace(/['"]/g, ''), parseFloat(value)] as [string, number];
      })
  );

const strengthAt = (distance: number, radius: number, falloff: Falloff) => {
  if (distance >= radius) return 0;
  const norm = 1 - distance / radius;
  switch (falloff) {
    case 'exponential':
      return norm * norm;
    case 'gaussian':
      return (Math.exp(-2 * (distance / radius) ** 2) - GAUSSIAN_EDGE) / (1 - GAUSSIAN_EDGE);
    case 'linear':
    default:
      return norm;
  }
};

const VariableProximity = (props: VariableProximityProps) => {
  // Everything the port handles explicitly is split off; `rest` carries the
  // caller's remaining HTML attributes onto the root span (upstream spread
  // `...restProps` the same way).
  const [, rest] = splitProps(props, [
    'label',
    'fromFontVariationSettings',
    'toFontVariationSettings',
    'containerRef',
    'radius',
    'falloff',
    'smoothing',
    'fromColor',
    'toColor',
    'scale',
    'lift',
    'idleWave',
    'fontSize',
    'class',
    'className',
    'onClick',
    'style',
    'ref'
  ]);
  let root: HTMLSpanElement | null = null;
  let letters: (HTMLSpanElement | null)[] = [];
  const state: ProximityState = { pointer: { x: 0, y: 0, active: false }, levels: [], targets: [] };
  const [lineStarts, setLineStarts] = createSignal<string | null>(null);

  const fromSettings = () => props.fromFontVariationSettings ?? DEFAULT_FROM;
  const toSettings = () => props.toFontVariationSettings ?? DEFAULT_TO;

  // Upstream's forwardRef setRoot: keep the internal ref and forward to the
  // caller's callback.
  const setRoot = (node: HTMLSpanElement) => {
    root = node;
    if (typeof props.ref === 'function') props.ref(node);
  };

  const axes = createMemo(() => {
    const from = parseSettings(fromSettings());
    const to = parseSettings(toSettings());
    return Array.from(from.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: to.get(axis) ?? fromValue
    }));
  });

  // Upstream: isomorphic layout effect ([label, fromFontVariationSettings,
  // fontSize]) measuring which words start a new line.
  createEffect(() => {
    props.label ?? '';
    const fromValue = fromSettings();
    props.fontSize;
    const el = root;
    if (!el) return;
    let frame = 0;
    let live = true;
    let lastWidth = -1;

    const measure = () => {
      frame = 0;
      if (!live) return;
      const words = Array.from(el.querySelectorAll<HTMLElement>('[data-word]'));
      const breaks = Array.from(el.querySelectorAll<HTMLElement>('br'));
      const letterEls = letters.filter((letter): letter is HTMLSpanElement => Boolean(letter));
      const saved = letterEls.map(letter => letter.style.fontVariationSettings);
      const wrap = el.style.whiteSpace;
      el.style.whiteSpace = 'normal';
      breaks.forEach(node => (node.style.display = 'none'));
      letterEls.forEach(letter => (letter.style.fontVariationSettings = fromValue));
      const starts: number[] = [];
      let lastTop: number | null = null;
      words.forEach((word, index) => {
        const top = word.getBoundingClientRect().top;
        if (lastTop !== null && top > lastTop + 2) starts.push(index);
        lastTop = top;
      });
      letterEls.forEach((letter, index) => (letter.style.fontVariationSettings = saved[index]));
      breaks.forEach(node => (node.style.display = ''));
      el.style.whiteSpace = wrap;
      const key = starts.join(',');
      setLineStarts(previous => (previous === key ? previous : key));
    };

    const queue = (entries?: ResizeObserverEntry[]) => {
      const width = entries?.[0]?.contentRect.width;
      if (width !== undefined) {
        if (Math.abs(width - lastWidth) < 1) return;
        lastWidth = width;
      }
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    const parent = el.parentElement;
    const observer = parent && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(queue) : null;
    if (parent) observer?.observe(parent);
    document.fonts?.ready.then(() => queue());

    onCleanup(() => {
      live = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    });
  });

  // Upstream: useEffect with the full reactive dep list — pointer tracking,
  // per-letter rAF loop, wave/tint/transform writers.
  createEffect(() => {
    const axesNow = axes();
    const fromValue = fromSettings();
    const containerRefProp = props.containerRef;
    const radius = props.radius ?? 50;
    const falloff = props.falloff ?? 'linear';
    const smoothing = props.smoothing ?? 0.2;
    const fromColor = props.fromColor;
    const toColor = props.toColor;
    const scale = props.scale ?? 1;
    const lift = props.lift ?? 0;
    const idleWave = props.idleWave ?? false;
    props.fontSize;
    props.label ?? '';
    lineStarts();

    const { pointer, levels, targets } = state;
    const written: string[] = [];
    const painted: string[] = [];
    const moved: string[] = [];
    const anchors: { x: number; y: number }[] = [];
    const tinted = Boolean(fromColor || toColor);
    const restColor = fromColor || 'currentColor';
    const nearColor = toColor || 'currentColor';
    const growth = (Number(scale) || 1) - 1;
    const rise = Number(lift) || 0;
    const transformed = growth !== 0 || rise !== 0;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const waving = idleWave && !reduced;
    let frame = 0;
    let lastTime = 0;
    let dirty = true;
    let layoutDirty = true;
    let nearAny = false;
    let lastNear = -Infinity;
    let waveMix = 0;
    let span = 1;
    let visible = true;

    letters.forEach(letter => {
      if (!letter) return;
      if (!tinted) letter.style.color = '';
      if (!transformed) letter.style.transform = '';
    });

    const settingsAt = (level: number) =>
      axesNow.map(({ axis, fromValue, toValue }) => `'${axis}' ${fromValue + (toValue - fromValue) * level}`).join(', ');

    const measureAnchors = () => {
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      letters.forEach((letter, index) => {
        if (!letter) return;
        const rect = letter.getBoundingClientRect();
        anchors[index] = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        left = Math.min(left, rect.left);
        top = Math.min(top, rect.top);
        right = Math.max(right, rect.right);
      });
      anchors.forEach(anchor => {
        anchor.x -= left;
        anchor.y -= top;
      });
      span = Math.max(220, (right - left) * 0.85);
    };

    const measure = () => {
      letters;
      targets.length = letters.length;
      targets.fill(0);
      nearAny = false;
      if (!pointer.active) return;

      const area = containerRefProp?.current?.getBoundingClientRect();
      if (area) {
        const dx = Math.max(area.left - pointer.x, 0, pointer.x - area.right);
        const dy = Math.max(area.top - pointer.y, 0, pointer.y - area.bottom);
        if (dx * dx + dy * dy >= radius * radius) return;
      }

      letters.forEach((letter, index) => {
        if (!letter) return;
        const rect = letter.getBoundingClientRect();
        const distance = Math.hypot(pointer.x - (rect.left + rect.width / 2), pointer.y - (rect.top + rect.height / 2));
        targets[index] = strengthAt(distance, radius, falloff);
        if (targets[index] > 0) nearAny = true;
      });
    };

    const waveAt = (index: number, time: number) => {
      const anchor = anchors[index];
      if (!anchor) return 0;
      const phase = ((anchor.x + anchor.y * 0.6) / span - time / WAVE_PERIOD) * Math.PI * 2;
      return WAVE_PEAK * ((1 + Math.cos(phase)) / 2) ** 2.2;
    };

    const tick = (now: number) => {
      frame = 0;
      const delta = lastTime ? Math.min(now - lastTime, 64) : 16;
      lastTime = now;

      if (dirty) {
        measure();
        dirty = false;
      }
      if (waving && layoutDirty) {
        measureAnchors();
        layoutDirty = false;
      }

      if (nearAny) lastNear = now;
      const idle = waving && visible && !nearAny && now - lastNear > 500;
      const goal = idle ? 1 : 0;
      waveMix += (goal - waveMix) * (1 - Math.exp(-delta / 600));
      if (Math.abs(goal - waveMix) < 0.002) waveMix = goal;

      const ease = smoothing > 0 ? 1 - Math.exp(-delta / (smoothing * 400)) : 1;
      const time = now / 1000;
      let settling = false;

      letters.forEach((letter, index) => {
        if (!letter) return;
        let target = targets[index] ?? 0;
        if (waveMix > 0) target = Math.max(target, waveMix * waveAt(index, time));
        const current = levels[index] ?? 0;
        let next = current + (target - current) * ease;
        if (Math.abs(target - next) < 0.002) {
          next = target;
        } else {
          settling = true;
        }
        levels[index] = next;

        const settings = next === 0 ? fromValue : settingsAt(next);
        if (written[index] !== settings) {
          written[index] = settings;
          letter.style.fontVariationSettings = settings;
        }

        if (tinted) {
          const paint =
            next === 0
              ? fromColor || ''
              : `color-mix(in oklab, ${restColor} ${((1 - next) * 100).toFixed(1)}%, ${nearColor})`;
          if (painted[index] !== paint) {
            painted[index] = paint;
            letter.style.color = paint;
          }
        }

        if (transformed) {
          const shift =
            next === 0 ? '' : `translateY(${(-rise * next).toFixed(3)}em) scale(${(1 + growth * next).toFixed(3)})`;
          if (moved[index] !== shift) {
            moved[index] = shift;
            letter.style.transform = shift;
          }
        }
      });

      if (settling || waveMix > 0 || (waving && visible && !nearAny)) {
        frame = requestAnimationFrame(tick);
      } else {
        lastTime = 0;
      }
    };

    const schedule = () => {
      dirty = true;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const relayout = () => {
      layoutDirty = true;
      schedule();
    };

    const handleMove = (x: number, y: number) => {
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      schedule();
    };

    const handleMouseMove = (event: MouseEvent) => handleMove(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) handleMove(touch.clientX, touch.clientY);
    };
    const handleLeave = () => {
      pointer.active = false;
      schedule();
    };

    const docRoot = document.documentElement;
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleLeave);
    window.addEventListener('touchcancel', handleLeave);
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', relayout);
    docRoot.addEventListener('mouseleave', handleLeave);

    let observer: IntersectionObserver | null = null;
    if (waving && root && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        schedule();
      });
      observer.observe(root);
    }
    if (waving) document.fonts?.ready.then(relayout);

    schedule();

    onCleanup(() => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleLeave);
      window.removeEventListener('touchcancel', handleLeave);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', relayout);
      docRoot.removeEventListener('mouseleave', handleLeave);
    });
  });

  // Words with globally indexed letters (upstream incremented letterIndex
  // across the render pass; the component body runs once in Solid).
  const words = createMemo(() => {
    let idx = 0;
    return (props.label ?? '').split(' ').map(word => {
      const wordLetters = word.split('').map(ch => ({ ch, i: idx++ }));
      return { word, letters: wordLetters };
    });
  });

  const breakSet = createMemo(() => new Set(lineStarts() ? lineStarts()!.split(',').map(Number) : []));

  return (
    <>
      <style>{FONT_IMPORT}</style>
      <span
        ref={setRoot}
        class={`${props.class ?? ''} ${props.className ?? ''}`.trim()}
        onClick={() => props.onClick?.()}
        style={{
          display: 'inline',
          'font-family': '"Roboto Flex", sans-serif',
          ...(props.fontSize !== undefined
            ? { 'font-size': typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize }
            : {}),
          ...(lineStarts() !== null ? { 'white-space': 'nowrap' as const } : {}),
          ...props.style
        }}
        {...rest}
      >
        <For each={words()}>
          {(word, wordIndex) => (
            <>
              <Show when={breakSet().has(wordIndex())}>
                <br />
              </Show>
              <span data-word="" class="inline-block whitespace-nowrap">
                <For each={word.letters}>
                  {letter => (
                    <span
                      ref={el => {
                        letters[letter.i] = el;
                        onCleanup(() => {
                          if (letters[letter.i] === el) letters[letter.i] = null;
                        });
                      }}
                      style={{
                        display: 'inline-block',
                        'font-variation-settings': fromSettings(),
                        color: props.fromColor || undefined,
                        'transform-origin': '50% 80%'
                      }}
                      aria-hidden="true"
                    >
                      {letter.ch}
                    </span>
                  )}
                </For>
                <Show when={wordIndex() < words().length - 1}>
                  <span class="inline-block">&nbsp;</span>
                </Show>
              </span>
            </>
          )}
        </For>
        <span class="sr-only">{props.label ?? ''}</span>
      </span>
    </>
  );
};

export default VariableProximity;
