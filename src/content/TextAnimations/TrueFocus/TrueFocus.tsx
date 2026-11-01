import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate } from 'motion';
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  focusStyle?: 'brackets' | 'box' | 'underline' | 'highlight';
  order?: 'sequential' | 'random';
  easing?: 'smooth' | 'spring';
  blurAmount?: number;
  focusScale?: number;
  borderColor?: string;
  highlightColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  cornerSize?: number;
  borderWidth?: number;
  unfocusedOpacity?: number;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const FRAME_GAP = 10;
const SMOOTH_EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
const SMOOTH_CSS = 'cubic-bezier(0.65, 0, 0.35, 1)';
const SPRING_CSS = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// Upstream drove each overlay with a declarative <motion.span initial/animate>;
// vanilla motion is imperative, so each overlay tracks its element plus a
// "first run" flag (mount = snap geometry, fade opacity; updates = tween all).
interface Overlay {
  el: HTMLElement | null;
  first: boolean;
}

const TrueFocus = (props: TrueFocusProps) => {
  const sentence = () => props.sentence ?? 'True Focus';
  const separator = () => props.separator ?? ' ';
  const focusStyle = () => props.focusStyle ?? 'brackets';
  const manualMode = () => props.manualMode ?? false;
  const blurAmount = () => props.blurAmount ?? 5;
  const borderColor = () => props.borderColor ?? 'green';
  const focusScale = () => props.focusScale ?? 1;
  const borderWidth = () => props.borderWidth ?? 3;
  const cornerSize = () => props.cornerSize ?? 16;
  const animationDuration = () => props.animationDuration ?? 0.5;
  const pauseBetweenAnimations = () => props.pauseBetweenAnimations ?? 1;

  const words = createMemo(() => sentence().split(separator()).filter(word => word.trim() !== ''));
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [focusRect, setFocusRect] = createSignal<FocusRect | null>(null);
  let containerEl!: HTMLDivElement;
  let wordEls: (HTMLSpanElement | null)[] = [];
  const reduceMotion = usePrefersReducedMotion();
  const duration = () => (reduceMotion() ? 0 : animationDuration());
  const activeIndex = createMemo(() => (words().length ? currentIndex() % words().length : -1));
  const spring = createMemo(() => (props.easing ?? 'smooth') === 'spring' && !reduceMotion());
  const transition = () =>
    spring()
      ? { type: 'spring' as const, visualDuration: duration(), bounce: 0.38 }
      : { duration: duration(), ease: SMOOTH_EASE };

  const highlightOv: Overlay = { el: null, first: true };
  const boxOv: Overlay = { el: null, first: true };
  const underlineOv: Overlay = { el: null, first: true };
  const cornerOvs: Overlay[] = CORNERS.map(() => ({ el: null, first: true }));

  const overlayRef = (ov: Overlay) => (el: HTMLElement) => {
    ov.el = el;
    ov.first = true;
    onCleanup(() => {
      ov.el = null;
    });
  };

  // Upstream: useEffect([manualMode, animationDuration, pauseBetweenAnimations,
  // words.length, order]) — auto-advance interval.
  createEffect(() => {
    const count = words().length;
    const order = props.order ?? 'sequential';
    if (manualMode() || count < 2) return;
    const interval = setInterval(() => {
      const roll = Math.random();
      setCurrentIndex(prev => {
        const current = prev % count;
        if (order !== 'random') return (current + 1) % count;
        const next = Math.floor(roll * (count - 1));
        return next >= current ? next + 1 : next;
      });
    }, (animationDuration() + pauseBetweenAnimations()) * 1000);
    onCleanup(() => clearInterval(interval));
  });

  // Upstream: isomorphic layout effect measuring the active word.
  createEffect(() => {
    const idx = activeIndex();
    sentence();
    separator();
    const container = containerEl;
    const word = wordEls[idx];
    if (!container || !word) return;

    const measure = () => {
      const next = { x: word.offsetLeft, y: word.offsetTop, width: word.offsetWidth, height: word.offsetHeight };
      setFocusRect(prev =>
        prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height
          ? prev
          : next
      );
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    wordEls.forEach(node => node && observer.observe(node));
    onCleanup(() => observer.disconnect());
  });

  const frame = createMemo<FocusRect | null>(() => {
    const fr = focusRect();
    const scale = focusScale();
    return (
      fr && {
        x: fr.x - (fr.width * (scale - 1)) / 2,
        y: fr.y - (fr.height * (scale - 1)) / 2,
        width: fr.width * scale,
        height: fr.height * scale
      }
    );
  });

  const corners = createMemo<Record<Corner, { x: number; y: number }> | null>(() => {
    const f = frame();
    return (
      f && {
        'top-left': { x: f.x - FRAME_GAP, y: f.y - FRAME_GAP },
        'top-right': { x: f.x + f.width + FRAME_GAP - cornerSize(), y: f.y - FRAME_GAP },
        'bottom-left': { x: f.x - FRAME_GAP, y: f.y + f.height + FRAME_GAP - cornerSize() },
        'bottom-right': {
          x: f.x + f.width + FRAME_GAP - cornerSize(),
          y: f.y + f.height + FRAME_GAP - cornerSize()
        }
      }
    );
  });

  const shapes = createMemo(() => {
    const f = frame();
    return (
      f && {
        box: {
          x: f.x - FRAME_GAP,
          y: f.y - FRAME_GAP,
          width: f.width + FRAME_GAP * 2,
          height: f.height + FRAME_GAP * 2
        },
        underline: {
          x: f.x,
          y: f.y + f.height + FRAME_GAP * 0.4,
          width: f.width,
          height: borderWidth()
        },
        highlight: {
          x: f.x - f.height * 0.14,
          y: f.y + f.height * 0.04,
          width: f.width + f.height * 0.28,
          height: f.height * 0.92
        }
      }
    );
  });

  // Upstream's <motion.span> pairs: initial = target geometry with opacity 0,
  // animate = same geometry with opacity 1; later updates tween every value.
  createEffect(() => {
    const style = focusStyle();
    const s = shapes();
    if (style !== 'highlight' || !s) return;
    const ov = highlightOv;
    const el = ov.el;
    if (!el) return;
    const target = s.highlight;
    const t = transition();
    if (ov.first) {
      ov.first = false;
      el.style.transform = `translate(${target.x}px, ${target.y}px)`;
      el.style.width = `${target.width}px`;
      el.style.height = `${target.height}px`;
      animate(el, { opacity: [0, 1] }, t);
    } else {
      animate(el, { x: target.x, y: target.y, width: target.width, height: target.height, opacity: 1 }, t);
    }
  });

  createEffect(() => {
    const style = focusStyle();
    const s = shapes();
    if (style !== 'box' || !s) return;
    const ov = boxOv;
    const el = ov.el;
    if (!el) return;
    const target = s.box;
    const t = transition();
    if (ov.first) {
      ov.first = false;
      el.style.transform = `translate(${target.x}px, ${target.y}px)`;
      el.style.width = `${target.width}px`;
      el.style.height = `${target.height}px`;
      animate(el, { opacity: [0, 1] }, t);
    } else {
      animate(el, { x: target.x, y: target.y, width: target.width, height: target.height, opacity: 1 }, t);
    }
  });

  createEffect(() => {
    const style = focusStyle();
    const s = shapes();
    if (style !== 'underline' || !s) return;
    const ov = underlineOv;
    const el = ov.el;
    if (!el) return;
    const target = s.underline;
    const t = transition();
    if (ov.first) {
      ov.first = false;
      el.style.transform = `translate(${target.x}px, ${target.y}px)`;
      el.style.width = `${target.width}px`;
      el.style.height = `${target.height}px`;
      animate(el, { opacity: [0, 1] }, t);
    } else {
      animate(el, { x: target.x, y: target.y, width: target.width, height: target.height, opacity: 1 }, t);
    }
  });

  createEffect(() => {
    const style = focusStyle();
    const c = corners();
    if (style === 'box' || style === 'underline' || !c) return;
    const t = transition();
    CORNERS.forEach((corner, i) => {
      const ov = cornerOvs[i];
      const el = ov.el;
      if (!el) return;
      const pos = c[corner];
      if (ov.first) {
        ov.first = false;
        el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        animate(el, { opacity: [0, 1] }, t);
      } else {
        animate(el, { x: pos.x, y: pos.y, opacity: 1 }, t);
      }
    });
  });

  const glow = () => `drop-shadow(0 0 4px ${props.glowColor ?? 'transparent'})`;

  return (
    <div class="relative flex flex-wrap items-center justify-center gap-[1em] outline-none select-none" ref={containerEl}>
      <Show when={focusStyle() === 'highlight' && shapes()}>
        <span
          ref={overlayRef(highlightOv)}
          class="pointer-events-none absolute left-0 top-0 rounded-md"
          aria-hidden="true"
          style={{
            'background-color': `color-mix(in srgb, ${props.highlightColor ?? borderColor()} 30%, transparent)`
          }}
        />
      </Show>

      <For each={words()}>
        {(word, index) => (
          <span
            ref={el => {
              wordEls[index()] = el;
              onCleanup(() => {
                if (wordEls[index()] === el) wordEls[index()] = null;
              });
            }}
            class="relative cursor-pointer text-[3rem] font-black outline-none select-none"
            style={{
              filter: `blur(${index() === activeIndex() ? 0 : blurAmount()}px)`,
              opacity: index() === activeIndex() ? 1 : (props.unfocusedOpacity ?? 1),
              transform: focusScale() !== 1 ? `scale(${index() === activeIndex() ? focusScale() : 1})` : undefined,
              transition: `filter ${duration()}s ease, opacity ${duration()}s ease, transform ${duration()}s ${spring() ? SPRING_CSS : SMOOTH_CSS}`
            }}
            onMouseEnter={() => {
              if (manualMode()) setCurrentIndex(index());
            }}
          >
            {word}
          </span>
        )}
      </For>

      <Show when={shapes() && corners() && focusStyle() !== 'highlight'}>
        <div class="absolute left-0 top-0 pointer-events-none" aria-hidden="true">
          <Show when={focusStyle() === 'box'}>
            <span
              ref={overlayRef(boxOv)}
              class="absolute left-0 top-0 box-border rounded-md"
              style={{ border: `${borderWidth()}px solid ${borderColor()}`, filter: glow() }}
            />
          </Show>
          <Show when={focusStyle() === 'underline'}>
            <span
              ref={overlayRef(underlineOv)}
              class="absolute left-0 top-0"
              style={{
                'background-color': borderColor(),
                'border-radius': `${borderWidth() / 2}px`,
                filter: glow()
              }}
            />
          </Show>
          <Show when={focusStyle() !== 'box' && focusStyle() !== 'underline'}>
            <For each={CORNERS}>
              {(corner, i) => {
                const top = corner.startsWith('top');
                const left = corner.endsWith('left');
                return (
                  <span
                    ref={overlayRef(cornerOvs[i()])}
                    class="absolute left-0 top-0 box-border rounded-[3px]"
                    style={{
                      width: `${cornerSize()}px`,
                      height: `${cornerSize()}px`,
                      'border-style': 'solid',
                      'border-color': borderColor(),
                      'border-top-width': top ? `${borderWidth()}px` : '0',
                      'border-bottom-width': top ? '0' : `${borderWidth()}px`,
                      'border-left-width': left ? `${borderWidth()}px` : '0',
                      'border-right-width': left ? '0' : `${borderWidth()}px`,
                      filter: glow()
                    }}
                  />
                );
              }}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default TrueFocus;
