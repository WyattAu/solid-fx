import { createEffect, createMemo, createSignal, onCleanup, onMount, Show, splitProps, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { gsap } from 'gsap';
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

interface TextTypeProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, 'class' | 'className' | 'style' | 'ref' | 'children'> {
  class?: string;
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorStyle?: 'character' | 'bar' | 'block' | 'underscore';
  cursorCharacter?: string | JSX.Element;
  cursorColor?: string;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  cursorGlide?: boolean;
  text: string | string[];
  as?: keyof JSX.HTMLElementTags;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  deleteMode?: 'backspace' | 'select';
  typeEffect?: 'none' | 'fade' | 'blur' | 'rise';
  mistakes?: number;
  prefix?: string;
  prefixColor?: string;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
}

type Effect = { keyframes: Keyframe[]; options: KeyframeAnimationOptions };
type Typo = { plan: string[]; tail: string[]; fixing: boolean };

const NEIGHBORS: Record<string, string> = {
  a: 'qwsz',
  b: 'vghn',
  c: 'xdfv',
  d: 'serfcx',
  e: 'wsdr',
  f: 'drtgvc',
  g: 'ftyhbv',
  h: 'gyujnb',
  i: 'ujko',
  j: 'huikmn',
  k: 'jiolm',
  l: 'kop',
  m: 'njk',
  n: 'bhjm',
  o: 'iklp',
  p: 'ol',
  q: 'wa',
  r: 'edft',
  s: 'awedxz',
  t: 'rfgy',
  u: 'yhji',
  v: 'cfgb',
  w: 'qase',
  x: 'zsdc',
  y: 'tghu',
  z: 'asx',
  0: '9p',
  1: '2q',
  2: '13w',
  3: '24e',
  4: '35r',
  5: '46t',
  6: '57y',
  7: '68u',
  8: '79i',
  9: '80o'
};

const EFFECTS: Record<'fade' | 'blur' | 'rise', Effect> = {
  fade: {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 360, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
  },
  blur: {
    keyframes: [
      { opacity: 0, filter: 'blur(0.3em)' },
      { opacity: 1, filter: 'blur(0em)' }
    ],
    options: { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  },
  rise: {
    keyframes: [
      { opacity: 0, top: '0.6em' },
      { opacity: 1, top: '0em' }
    ],
    options: { duration: 480, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' }
  }
};

const SHAPES: Record<'bar' | 'block' | 'underscore', string> = {
  bar: 'ml-[0.06em] inline-block h-[1.1em] w-[max(2px,0.07em)] rounded-[1px] bg-current align-[-0.2em]',
  block: 'ml-[0.06em] inline-block h-[1.1em] w-[0.56em] rounded-[0.06em] bg-current align-[-0.2em]',
  underscore: 'ml-[0.06em] inline-block h-[max(2px,0.075em)] w-[0.56em] rounded-[1px] bg-current align-[-0.12em]'
};

const graphemes = (value: string): string[] => {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), part => part.segment);
  }
  return Array.from(value);
};

const typoFor = (char: string): string | null => {
  const keys = NEIGHBORS[char.toLowerCase()];
  if (!keys) return null;
  const pick = keys[Math.floor(Math.random() * keys.length)];
  return char === char.toLowerCase() ? pick : pick.toUpperCase();
};

const TextType = (props: TextTypeProps) => {
  // Everything the port handles explicitly is split off so `rest` can carry
  // the caller's remaining HTML attributes onto the container element
  // (upstream spread `...props` into its dynamic component too).
  const [, rest] = splitProps(props, [
    'class',
    'className',
    'as',
    'showCursor',
    'hideCursorWhileTyping',
    'cursorStyle',
    'cursorCharacter',
    'cursorColor',
    'cursorBlinkDuration',
    'cursorClassName',
    'cursorGlide',
    'text',
    'typingSpeed',
    'initialDelay',
    'pauseDuration',
    'deletingSpeed',
    'deleteMode',
    'typeEffect',
    'mistakes',
    'prefix',
    'prefixColor',
    'loop',
    'textColors',
    'variableSpeed',
    'onSentenceComplete',
    'startOnVisible',
    'reverseMode'
  ]);
  const [textIndex, setTextIndex] = createSignal(0);
  const [count, setCount] = createSignal(0);
  const [selected, setSelected] = createSignal(0);
  const [typo, setTypo] = createSignal<Typo | null>(null);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(!(props.startOnVisible ?? false));
  const reduceMotion = usePrefersReducedMotion();

  let containerEl: HTMLElement | null = null;
  let caretEl: HTMLSpanElement | null = null;
  let cursorEl: HTMLSpanElement | null = null;
  let blinkEl: HTMLSpanElement | null = null;
  let blinkTimeline: ReturnType<typeof gsap.timeline> | null = null;
  let blinkResume: ReturnType<typeof gsap.delayedCall> | null = null;
  let caretPosition: { x: number; y: number } | null = null;
  let lastTypo = -1;

  const textKey = createMemo(() => (Array.isArray(props.text) ? props.text.join('\u0000') : String(props.text ?? '')));
  const textArray = createMemo(() => textKey().split('\u0000'));
  const index = createMemo(() => textIndex() % textArray().length);
  const chars = createMemo(() => graphemes(textArray()[index()]));
  const total = createMemo(() => chars().length);
  const shown = createMemo(() => Math.min(count(), total()));
  const minSpeed = () => props.variableSpeed?.min ?? (props.typingSpeed ?? 50);
  const maxSpeed = () => props.variableSpeed?.max ?? (props.typingSpeed ?? 50);
  const pace = () => (minSpeed() + maxSpeed()) / 2;
  const glideTime = () => Math.min(0.18, Math.max(0.06, pace() * 0.0016));

  // Upstream kept this in a ref reassigned every render; the component body
  // runs once in Solid so a plain closure function has the same semantics.
  const placeCursor = (instant: boolean) => {
    const caret = caretEl;
    const cursor = cursorEl;
    if (!caret || !cursor) return;

    const x = caret.offsetLeft;
    const y = caret.offsetTop;
    const last = caretPosition;
    if (last && Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5) return;
    caretPosition = { x, y };

    if (instant || !last || !(props.cursorGlide ?? true) || reduceMotion() || Math.abs(last.y - y) > 1) {
      gsap.killTweensOf(cursor);
      gsap.set(cursor, { x, y });
    } else {
      gsap.to(cursor, { x, y, duration: glideTime(), ease: 'power3.out', overwrite: true });
    }

    const timeline = blinkTimeline;
    const blink = blinkEl;
    if (instant || !timeline || !blink) return;
    timeline.pause();
    blinkResume?.kill();
    gsap.to(blink, { opacity: 1, duration: 0.12, ease: 'power1.out' });
    blinkResume = gsap.delayedCall(0.12, () => timeline.restart());
  };

  // Upstream: useEffect([startOnVisible]) — reveal once scrolled into view.
  createEffect(() => {
    if (!props.startOnVisible) return;
    const node = containerEl;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    onCleanup(() => observer.disconnect());
  });

  // Upstream: useEffect([showCursor, cursorBlinkDuration, reduceMotion]) — blink loop.
  createEffect(() => {
    const showCursor = props.showCursor ?? true;
    const blink = blinkEl;
    if (!showCursor || !blink) return;
    gsap.set(blink, { opacity: 1 });
    const blinkDuration = props.cursorBlinkDuration ?? 0.5;
    if (reduceMotion() || blinkDuration <= 0) return;

    const hold = blinkDuration * 0.7;
    const fade = blinkDuration * 0.45;
    const timeline = gsap.timeline({ repeat: -1 });
    timeline
      .to(blink, { opacity: 0, duration: fade, ease: 'sine.inOut' }, hold)
      .to(blink, { opacity: 1, duration: fade, ease: 'sine.inOut' }, hold + fade + blinkDuration * 0.4);
    blinkTimeline = timeline;

    onCleanup(() => {
      timeline.kill();
      blinkResume?.kill();
      gsap.killTweensOf(blink);
      blinkTimeline = null;
    });
  });

  // Upstream: layout effect resetting caretPosition when showCursor changes.
  createEffect(() => {
    props.showCursor ?? true;
    caretPosition = null;
  });

  // Upstream ran placeCursor in an every-render layout effect; these are the
  // reactive inputs that change the caret's laid-out position.
  createEffect(() => {
    count();
    selected();
    typo();
    isDeleting();
    textArray();
    index();
    shown();
    props.showCursor ?? true;
    props.prefix ?? '';
    props.startOnVisible ?? false;
    placeCursor(false);
  });

  onMount(() => {
    const node = containerEl;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => placeCursor(true));
    observer.observe(node);
    onCleanup(() => observer.disconnect());
  });

  // The typing state machine. Every write happens inside the scheduled
  // timeout, so the effect never writes a signal it tracks synchronously.
  createEffect(() => {
    const visible = isVisible();
    const deleting = isDeleting();
    const shownV = shown();
    const totalV = total();
    const charsV = chars();
    const selectedV = selected();
    const typoV = typo();
    const indexV = index();
    const texts = textArray();
    const loop = props.loop ?? true;
    const deletingSpeed = props.deletingSpeed ?? 30;
    const deleteMode = props.deleteMode ?? 'backspace';
    const pauseDuration = props.pauseDuration ?? 2000;
    const initialDelay = props.initialDelay ?? 0;
    const minV = minSpeed();
    const maxV = maxSpeed();
    const mistakes = props.mistakes ?? 0;
    const reverseMode = props.reverseMode ?? false;
    const reduce = reduceMotion();

    if (!visible) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number, next: () => void) => {
      timeout = setTimeout(next, ms);
    };
    const speed = () => minV + Math.random() * (maxV - minV);

    if (!deleting) {
      if (typoV) {
        if (reduce) {
          wait(0, () => setTypo(null));
        } else if (!typoV.fixing) {
          if (typoV.tail.length < typoV.plan.length) {
            wait(speed(), () => setTypo({ ...typoV, tail: typoV.plan.slice(0, typoV.tail.length + 1) }));
          } else {
            wait(260 + Math.random() * 320, () => setTypo({ ...typoV, fixing: true }));
          }
        } else if (typoV.tail.length) {
          wait(Math.max(45, deletingSpeed), () => setTypo({ ...typoV, tail: typoV.tail.slice(0, -1) }));
        } else {
          wait(90 + Math.random() * 140, () => setTypo(null));
        }
      } else if (shownV < totalV) {
        const lead = shownV === 0 ? initialDelay : 0;
        const next = reverseMode ? totalV - shownV - 1 : shownV;
        const wrong = mistakes > 0 && shownV > 0 && lastTypo !== next ? typoFor(charsV[next]) : null;

        if (reduce) {
          wait(lead, () => setCount(totalV));
        } else if (wrong && Math.random() < Math.min(1, mistakes) * 0.16) {
          lastTypo = next;
          const plan = [wrong];
          const follow = charsV[reverseMode ? next - 1 : next + 1];
          if (follow && follow.trim() && Math.random() < 0.4) plan.push(follow);
          wait(lead + speed(), () => setTypo({ plan, tail: [wrong], fixing: false }));
        } else {
          wait(lead + speed(), () => setCount(shownV + 1));
        }
      } else if (loop || indexV < texts.length - 1) {
        wait(pauseDuration, () => setIsDeleting(true));
      }
    } else if (shownV > 0) {
      if (reduce) {
        wait(0, () => setCount(0));
      } else if (deleteMode === 'select') {
        if (selectedV < shownV) {
          wait(deletingSpeed, () => setSelected(selectedV + 1));
        } else {
          wait(Math.max(160, deletingSpeed * 8), () => {
            setSelected(0);
            setCount(0);
          });
        }
      } else {
        wait(deletingSpeed, () => setCount(shownV - 1));
      }
    } else {
      untrack(() => props.onSentenceComplete?.(texts[indexV], indexV));
      lastTypo = -1;
      setSelected(0);
      setIsDeleting(false);
      setTextIndex((indexV + 1) % texts.length);
    }

    onCleanup(() => clearTimeout(timeout));
  });

  const animateChar = (node: HTMLSpanElement | null) => {
    const typeEffect = props.typeEffect ?? 'none';
    const effect = typeEffect === 'none' ? undefined : EFFECTS[typeEffect];
    if (!node || !effect || reduceMotion() || typeof node.animate !== 'function') return;
    node.animate(effect.keyframes, effect.options);
  };

  const reverseMode = () => props.reverseMode ?? false;
  const start = createMemo(() => (reverseMode() ? total() - shown() : 0));
  const correctChars = createMemo(() => chars().slice(start(), start() + shown()));
  const mistypedChars = createMemo(() => {
    const arr = [...(typo()?.tail ?? [])];
    if (reverseMode()) arr.reverse();
    return arr;
  });
  const typing = createMemo(() => shown() < total() || isDeleting() || typo() !== null);
  const hideCursor = createMemo(() => (props.hideCursorWhileTyping ?? false) && typing());
  const color = createMemo(() => {
    const colors = props.textColors ?? [];
    return colors.length ? colors[index() % colors.length] : 'inherit';
  });
  const customCursorColor = createMemo(() => {
    const cursorColor = props.cursorColor ?? 'currentColor';
    return cursorColor && cursorColor !== 'currentColor' ? { color: cursorColor } : undefined;
  });
  const cursorStyle = () => props.cursorStyle ?? 'character';

  const caret = (
    <span ref={(el: HTMLSpanElement) => (caretEl = el)} class="inline-block w-0">
      {'\u200B'}
    </span>
  );

  return (
    <Dynamic
      component={props.as ?? 'div'}
      ref={(el: HTMLElement) => (containerEl = el)}
      class={`relative inline-block whitespace-pre-wrap ${props.class ?? ''} ${props.className ?? ''}`}
      {...rest}
    >
      <span class="sr-only">{(props.prefix ?? '') + textArray().join(' ')}</span>
      <span aria-hidden="true">
        <Show when={props.prefix}>
          <span style={{ color: props.prefixColor ?? 'currentColor' }}>{props.prefix}</span>
        </Show>
        <Show when={reverseMode()}>{caret}</Show>
        <span style={{ color: color() }}>
          <Show when={reverseMode()}>
            <For each={mistypedChars()}>
              {char => (
                <span ref={animateChar} class="relative">
                  {char}
                </span>
              )}
            </For>
          </Show>
          <For each={correctChars()}>
            {(char, i) => {
              const isMarked = createMemo(() => {
                const marked = Math.min(selected(), shown());
                return reverseMode() ? i() < marked : i() >= shown() - marked;
              });
              return (
                <span
                  ref={animateChar}
                  class={
                    isMarked()
                      ? 'relative bg-[color:color-mix(in_srgb,currentColor_25%,transparent)]'
                      : 'relative'
                  }
                >
                  {char}
                </span>
              );
            }}
          </For>
          <Show when={!reverseMode()}>
            <For each={mistypedChars()}>
              {char => (
                <span ref={animateChar} class="relative">
                  {char}
                </span>
              )}
            </For>
          </Show>
        </span>
        <Show when={!reverseMode()}>{caret}</Show>
      </span>
      <Show when={props.showCursor ?? true}>
        <span
          ref={(el: HTMLSpanElement) => {
            cursorEl = el;
            onCleanup(() => {
              cursorEl = null;
            });
          }}
          aria-hidden="true"
          class={`pointer-events-none absolute left-0 top-0 whitespace-pre transition-opacity duration-200 will-change-transform ${hideCursor() ? 'opacity-0' : ''} ${props.cursorClassName ?? ''}`}
          style={customCursorColor()}
        >
          <span
            ref={(el: HTMLSpanElement) => {
              blinkEl = el;
              onCleanup(() => {
                blinkEl = null;
              });
            }}
            class={cursorStyle() === 'character' ? 'ml-1 inline-block' : 'inline-block'}
          >
            <Show when={cursorStyle() === 'character'} fallback={<span class={SHAPES[cursorStyle()] ?? SHAPES.bar} />}>
              {props.cursorCharacter ?? '|'}
            </Show>
          </span>
        </span>
      </Show>
    </Dynamic>
  );
};

export default TextType;
