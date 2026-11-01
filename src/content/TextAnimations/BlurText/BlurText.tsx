import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { For } from 'solid-js';
import { animate } from 'motion';
import type { AnimationOptions, Easing, ValueTransition } from 'motion';
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

type Snapshot = Record<string, string | number>;
type Keyframes = Record<string, Array<string | number>>;
type Phase = 'from' | 'in' | 'out' | 'rest';

export type BlurTextEffect = 'blur' | 'zoom' | 'tilt' | 'focus' | 'drift';
export type BlurTextStaggerFrom = 'start' | 'center' | 'end' | 'random';
export type BlurTextTrigger = 'view' | 'load' | 'hover' | 'click';

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  class?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom' | 'left' | 'right';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Snapshot;
  animationTo?: Snapshot[];
  easing?: Easing | Easing[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
  blur?: number;
  distance?: number;
  effect?: BlurTextEffect;
  staggerFrom?: BlurTextStaggerFrom;
  trigger?: BlurTextTrigger;
  loop?: boolean;
  loopDelay?: number;
  color?: string;
  fromColor?: string;
  focusOnHover?: boolean;
};

interface EffectConfig {
  from: Snapshot;
  steps: Snapshot[];
  exit: Snapshot;
  times: number[];
  fade: Easing;
  bounce: number | null;
  settle: number;
  origin?: { originX: number; originY: number };
  exitEase: Easing;
}

interface Piece {
  word: number;
  content: string;
  key: string;
}

const AXES: Record<NonNullable<BlurTextProps['direction']>, ['x' | 'y', number]> = {
  top: ['y', -1],
  bottom: ['y', 1],
  left: ['x', -1],
  right: ['x', 1]
};

const EASE_OUT: Easing = [0.33, 1, 0.68, 1];
const EASE_IN_OUT: Easing = [0.65, 0, 0.35, 1];
const EASE_IN: Easing = [0.55, 0, 0.9, 0.45];
const CSS_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MOVE_KEYS = ['x', 'y', 'scale', 'rotateX', 'rotateY', 'skewX'];

const blurTo = (px: number) => `blur(${Math.max(0, px)}px)`;

const buildEffect = (
  effect: BlurTextEffect,
  direction: NonNullable<BlurTextProps['direction']>,
  blur: number,
  distance: number
): EffectConfig => {
  const [axis, sign] = AXES[direction] || AXES.top;
  const b = Math.max(0, blur);
  const d = distance;

  if (effect === 'zoom') {
    return {
      from: { filter: blurTo(b * 1.2), opacity: 0, scale: 1.4, [axis]: sign * d * 0.35 },
      steps: [
        { filter: blurTo(b * 0.2), opacity: 0.9, scale: 0.97, [axis]: -sign * d * 0.03 },
        { filter: blurTo(0), opacity: 1, scale: 1, [axis]: 0 }
      ],
      exit: { filter: blurTo(b), opacity: 0, scale: 0.82, [axis]: -sign * d * 0.2 },
      times: [0, 0.6, 1],
      fade: EASE_OUT,
      bounce: 0.25,
      settle: 0.5,
      exitEase: EASE_IN
    };
  }

  if (effect === 'tilt') {
    const rotate = axis === 'y' ? 'rotateX' : 'rotateY';
    const lean = axis === 'y' ? -sign : sign;
    return {
      from: { filter: blurTo(b), opacity: 0, [rotate]: lean * 55, [axis]: sign * d * 0.5, transformPerspective: 600 },
      steps: [
        {
          filter: blurTo(b * 0.15),
          opacity: 0.95,
          [rotate]: -lean * 8,
          [axis]: -sign * d * 0.04,
          transformPerspective: 600
        },
        { filter: blurTo(0), opacity: 1, [rotate]: 0, [axis]: 0, transformPerspective: 600 }
      ],
      exit: { filter: blurTo(b), opacity: 0, [rotate]: -lean * 40, [axis]: -sign * d * 0.3, transformPerspective: 600 },
      times: [0, 0.6, 1],
      fade: EASE_OUT,
      bounce: 0.3,
      settle: 0.8,
      origin: { originX: axis === 'x' ? (sign < 0 ? 0 : 1) : 0.5, originY: axis === 'y' ? (sign < 0 ? 0 : 1) : 0.5 },
      exitEase: EASE_IN
    };
  }

  if (effect === 'focus') {
    const soft: Snapshot = { filter: blurTo(b * 1.4), opacity: 0.32, scale: 1.12 };
    return {
      from: soft,
      steps: [
        { filter: blurTo(b * 0.1), opacity: 0.95, scale: 0.995 },
        { filter: blurTo(0), opacity: 1, scale: 1 }
      ],
      exit: soft,
      times: [0, 0.72, 1],
      fade: EASE_IN_OUT,
      bounce: null,
      settle: 1,
      exitEase: EASE_IN_OUT
    };
  }

  if (effect === 'drift') {
    const h = direction === 'right' ? 1 : -1;
    const v = axis === 'y' ? sign : 0;
    return {
      from: { filter: blurTo(b), opacity: 0, x: h * d * 1.6, y: v * d * 0.3, skewX: h * 28 },
      steps: [
        { filter: blurTo(b * 0.15), opacity: 0.95, x: -h * d * 0.06, y: 0, skewX: -h * 7 },
        { filter: blurTo(0), opacity: 1, x: 0, y: 0, skewX: 0 }
      ],
      exit: { filter: blurTo(b), opacity: 0, x: -h * d * 1.2, y: -v * d * 0.2, skewX: h * 20 },
      times: [0, 0.62, 1],
      fade: EASE_OUT,
      bounce: 0.3,
      settle: 0.55,
      exitEase: EASE_IN
    };
  }

  return {
    from: { filter: blurTo(b), opacity: 0, [axis]: sign * d },
    steps: [
      { filter: blurTo(b / 2), opacity: 0.5, [axis]: (-sign * d) / 10 },
      { filter: blurTo(0), opacity: 1, [axis]: 0 }
    ],
    exit: { filter: blurTo(b), opacity: 0, [axis]: -sign * d * 0.6 },
    times: [0, 0.5, 1],
    fade: 'linear',
    bounce: 0.35,
    settle: 0.5,
    exitEase: EASE_IN
  };
};

const buildKeyframes = (from: Snapshot, steps: Snapshot[]): Keyframes => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);

  const keyframes: Keyframes = {};
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])];
  });
  return keyframes;
};

const buildRanks = (count: number, staggerFrom: BlurTextStaggerFrom, seedText: string): number[] => {
  const ranks = Array.from({ length: count }, (_, i) => i);
  if (staggerFrom === 'end') return ranks.map(i => count - 1 - i);
  if (staggerFrom === 'center') {
    const mid = (count - 1) / 2;
    const offset = count % 2 === 0 ? 0.5 : 0;
    return ranks.map(i => Math.abs(i - mid) - offset);
  }
  if (staggerFrom === 'random') {
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619) >>> 0;
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const order = ranks.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach((piece, rank) => {
      ranks[piece] = rank;
    });
  }
  return ranks;
};

const startPhase = (trigger: BlurTextTrigger): Phase =>
  trigger === 'load' ? 'in' : trigger === 'hover' || trigger === 'click' ? 'rest' : 'from';

const BlurText = (props: BlurTextProps) => {
  const text = () => props.text ?? '';
  const delay = () => props.delay ?? 200;
  const animateBy = () => props.animateBy ?? 'words';
  const direction = () => props.direction ?? 'top';
  const threshold = () => props.threshold ?? 0.1;
  const rootMargin = () => props.rootMargin ?? '0px';
  const stepDuration = () => props.stepDuration ?? 0.35;
  const blur = () => props.blur ?? 10;
  const distance = () => props.distance ?? 50;
  const effect = () => props.effect ?? 'blur';
  const staggerFrom = () => props.staggerFrom ?? 'start';
  const trigger = () => props.trigger ?? 'view';
  const loop = () => props.loop ?? false;
  const loopDelay = () => props.loopDelay ?? 2;
  const focusOnHover = () => props.focusOnHover ?? false;

  const reduce = usePrefersReducedMotion();

  let ref!: HTMLParagraphElement;
  const [phase, setPhase] = createSignal<Phase>(startPhase(props.trigger ?? 'view'));
  const [focusWord, setFocusWord] = createSignal(-1);
  // Upstream settledRef — mutable flag read by event handlers.
  let settled = phase() === 'rest';

  const fx = createMemo(() => buildEffect(effect(), direction(), blur(), distance()));

  const custom = () => Boolean(props.animationFrom || props.animationTo || props.easing);
  const fromSnapshot = () => props.animationFrom ?? fx().from;
  const toSnapshots = () => props.animationTo ?? fx().steps;
  const exitSnapshot = () => props.animationFrom ?? fx().exit;
  const restSnapshot = () => toSnapshots()[toSnapshots().length - 1];
  const animateKeyframes = createMemo(() => buildKeyframes(fromSnapshot(), custom() ? toSnapshots() : [restSnapshot()]));

  const stepCount = () => toSnapshots().length + 1;
  const totalDuration = () => stepDuration() * (stepCount() - 1);
  const times = () =>
    props.animationTo
      ? Array.from({ length: stepCount() }, (_, i) => (stepCount() === 1 ? 0 : i / (stepCount() - 1)))
      : fx().times;
  const stagger = () => Math.max(0, delay()) / 1000;
  const exitDuration = () => stepDuration() * 1.3;
  const exitStagger = () => stagger() * 0.4;

  const words = createMemo(() => text().split(' '));

  const pieces = createMemo<Piece[]>(() => {
    const list: Piece[] = [];
    words().forEach((word, w) => {
      const isLast = w === words().length - 1;
      if (animateBy() === 'words') {
        list.push({ word: w, content: isLast ? word : `${word}\u00A0`, key: `word-${w}` });
        return;
      }
      Array.from(word).forEach((char, c) => list.push({ word: w, content: char, key: `char-${w}-${c}` }));
      if (!isLast) list.push({ word: w, content: '\u00A0', key: `space-${w}` });
    });
    return list;
  });

  const groups = createMemo(() => {
    const list: number[][] = words().map(() => []);
    pieces().forEach((piece, index) => list[piece.word].push(index));
    return list;
  });

  const ranks = createMemo(() => buildRanks(pieces().length, staggerFrom(), text()));
  const maxRank = () => ranks().reduce((max, rank) => Math.max(max, rank), 0);
  const inTotal = () => (totalDuration() * (custom() ? 1 : Math.max(1, fx().settle * 2.2)) + maxRank() * stagger()) * 1000;
  const outTotal = () => (exitDuration() + maxRank() * exitStagger()) * 1000;

  createEffect(() => {
    // Upstream deps: [phase, trigger, threshold, rootMargin]
    if (phase() !== 'from') return;
    if (trigger() === 'load') {
      setPhase('in');
      return;
    }
    if (trigger() === 'hover' || trigger() === 'click') {
      setPhase('rest');
      return;
    }
    const element = ref;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase(current => (current === 'from' ? 'in' : current));
          observer.disconnect();
        }
      },
      { threshold: threshold(), rootMargin: rootMargin() }
    );
    observer.observe(element);
    onCleanup(() => observer.disconnect());
  });

  createEffect(() => {
    // Upstream deps: [phase, loop, loopDelay, inTotal, outTotal]
    const currentPhase = phase();
    const isLoop = loop();
    const gap = Math.max(0, loopDelay()) * 1000;
    let timer = 0;
    if (currentPhase === 'in') {
      settled = false;
      timer = window.setTimeout(() => {
        settled = true;
        props.onAnimationComplete?.();
        if (isLoop) timer = window.setTimeout(() => setPhase('out'), gap);
      }, inTotal());
    } else if (currentPhase === 'rest') {
      settled = true;
      if (isLoop) timer = window.setTimeout(() => setPhase('out'), gap);
    } else if (currentPhase === 'out') {
      settled = false;
      timer = window.setTimeout(() => setPhase('in'), outTotal());
    }
    onCleanup(() => window.clearTimeout(timer));
  });

  // Rendered piece spans, keyed by piece key. Registration happens in the
  // ref callback; the matching onCleanup runs when the piece unmounts.
  const spans = new Map<string, HTMLSpanElement>();

  // Per-value overrides for the transform keys (upstream's MOVE_KEYS record).
  // The cast is needed because AnimationOptions' override branch is keyed by
  // style name and not directly writable as an object literal type.
  const asOptions = (options: Record<string, unknown>): AnimationOptions => options as unknown as AnimationOptions;

  const inOptions = (rank: number): AnimationOptions => {
    const delayed = rank * stagger();
    if (custom()) return asOptions({ duration: totalDuration(), times: times(), delay: delayed, ease: props.easing ?? 'linear' });
    const overrides: Record<string, ValueTransition> = {};
    if (fx().bounce !== null) {
      // MotionConfig reducedMotion="user": transforms jump, filter/opacity keep easing.
      const move: ValueTransition = reduce()
        ? { duration: 0 }
        : { type: 'spring', visualDuration: totalDuration() * fx().settle, bounce: fx().bounce, delay: delayed };
      for (const key of MOVE_KEYS) if (key in fromSnapshot()) overrides[key] = move;
    }
    return asOptions({ duration: totalDuration(), delay: delayed, ease: fx().fade, ...overrides });
  };

  const outOptions = (rank: number): AnimationOptions => {
    const base: Record<string, unknown> = { duration: exitDuration(), ease: fx().exitEase, delay: rank * exitStagger() };
    if (reduce()) {
      const exit = exitSnapshot();
      for (const key of MOVE_KEYS) if (key in exit) base[key] = { duration: 0 };
    }
    return asOptions(base);
  };

  // Replaces upstream's declarative `animate={target}` + per-piece
  // `transition`: every phase/prop change re-runs one vanilla animate() per
  // rendered piece.
  createEffect(() => {
    const currentPhase = phase();
    // Mirror upstream's reactive inputs.
    const keyframesIn = animateKeyframes();
    const from = fromSnapshot();
    const exit = exitSnapshot();
    const rest = restSnapshot();
    const piecesNow = pieces();
    const ranksNow = ranks();

    const target =
      currentPhase === 'in' ? keyframesIn : currentPhase === 'out' ? exit : currentPhase === 'rest' ? rest : from;
    const instant: AnimationOptions = { duration: 0 };
    const controls: { stop: () => void }[] = [];

    for (const [key, el] of spans) {
      const index = piecesNow.findIndex(piece => piece.key === key);
      if (index === -1) continue;
      const rank = ranksNow[index] ?? 0;
      if (currentPhase === 'in') {
        controls.push(animate(el, keyframesIn, inOptions(rank)));
      } else if (currentPhase === 'out') {
        controls.push(animate(el, exit, outOptions(rank)));
      } else {
        controls.push(animate(el, target, instant));
      }
    }
    onCleanup(() => controls.forEach(control => control.stop()));
  });

  const replay = () => {
    if (phase() === 'out' || phase() === 'from') return;
    setPhase('out');
  };

  const handleEnter = () => {
    if (settled) replay();
  };

  // Upstream passed framer's originX/originY via MotionStyle; mapped to a CSS
  // transform-origin here.
  const pieceOrigin = () => {
    const origin = fx().origin;
    if (!origin || custom()) return '';
    return `${origin.originX * 100}% ${origin.originY * 100}%`;
  };
  const tinted = () => Boolean(props.fromColor) && (phase() === 'from' || phase() === 'out');
  const dim = () => Math.min(6, Math.max(2, blur() * 0.3));

  return (
    <p
      ref={ref}
      class={`blur-text flex flex-wrap ${props.class ?? ''} ${props.className ?? ''}`}
      classList={{ 'cursor-pointer': trigger() === 'click' }}
      style={{ color: props.color }}
      onPointerEnter={() => {
        if (trigger() === 'hover') handleEnter();
      }}
      onClick={() => {
        if (trigger() === 'click') replay();
      }}
    >
      <span class="sr-only select-none">{text()}</span>
      <For each={groups()}>
        {(indices, w) => (
          <span
            class="inline-flex"
            style={{
              filter: focusOnHover() && focusWord() !== -1 && focusWord() !== w() ? `blur(${dim()}px)` : 'blur(0px)',
              opacity: focusOnHover() && focusWord() !== -1 && focusWord() !== w() ? 0.3 : 1,
              transition: `filter 0.45s ${CSS_EASE}, opacity 0.45s ${CSS_EASE}`
            }}
            onPointerEnter={() => {
              if (focusOnHover()) setFocusWord(w());
            }}
            onPointerLeave={() => {
              if (focusOnHover()) setFocusWord(-1);
            }}
          >
            <For each={indices}>
              {(index) => {
                const piece = pieces()[index];
                if (!piece) return null;
                const rank = ranks()[index] ?? 0;
                return (
                  <span
                    ref={(el) => {
                      spans.set(piece.key, el);
                      onCleanup(() => spans.delete(piece.key));
                    }}
                    aria-hidden="true"
                    class="inline-block will-change-[transform,filter,opacity]"
                    style={{
                      'transform-origin': pieceOrigin(),
                      color: tinted() ? (props.fromColor ?? '') : '',
                      transition: props.fromColor
                        ? phase() === 'in'
                          ? `color ${totalDuration() * 0.9}s ${CSS_EASE} ${rank * stagger()}s`
                          : phase() === 'out'
                            ? `color ${exitDuration()}s ${CSS_EASE} ${rank * exitStagger()}s`
                            : 'none'
                        : 'none'
                    }}
                  >
                    {piece.content}
                  </span>
                );
              }}
            </For>
          </span>
        )}
      </For>
    </p>
  );
};

export default BlurText;
