import { createEffect, createMemo, For, onCleanup } from 'solid-js';
import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type ScrollFloatEffect = 'float' | 'flip' | 'scatter' | 'blur' | 'wave';
type ScrollFloatSplit = 'chars' | 'words';
type ScrollFloatDirection = 'up' | 'down';
type ScrollFloatOrder = 'start' | 'end' | 'center' | 'edges' | 'random';

export interface ScrollFloatProps {
  children?: JSX.Element;
  /** Upstream accepted a React RefObject; a plain `{ current }` box works in Solid. */
  scrollContainerRef?: { current: HTMLElement | null };
  containerClassName?: string;
  textClassName?: string;
  effect?: ScrollFloatEffect;
  splitBy?: ScrollFloatSplit;
  direction?: ScrollFloatDirection;
  order?: ScrollFloatOrder;
  fromColor?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
  distance?: number;
  stretch?: number;
  smoothing?: number;
}

interface Part {
  key: number;
  space?: string;
  chars?: string[];
}

const clampToScroll = (position: string) =>
  typeof position === 'string' && !position.startsWith('clamp(') ? `clamp(${position})` : position;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const smoothstep = (from: number, to: number, value: number) => {
  const k = clamp01((value - from) / (to - from));
  return k * k * (3 - 2 * k);
};

const random = (index: number, salt: number) => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const getDelays = (count: number, order: ScrollFloatOrder, stagger: number) => {
  const middle = (count - 1) / 2;
  const ranks = Array.from({ length: count }, (_, index) => {
    if (order === 'end') return count - 1 - index;
    if (order === 'center') return Math.abs(index - middle);
    if (order === 'edges') return middle - Math.abs(index - middle);
    return index;
  });
  if (order === 'random') {
    const shuffled = ranks.map((_, index) => index).sort((a, b) => random(a, 9) - random(b, 9));
    shuffled.forEach((target, rank) => {
      ranks[target] = rank;
    });
  }
  const first = Math.min(...ranks);
  return ranks.map(rank => (rank - first) * Math.max(0, stagger));
};

const ScrollFloat = (props: ScrollFloatProps) => {
  let containerRef!: HTMLHeadingElement;
  let textRef!: HTMLSpanElement;

  // Upstream flattened children via Children.toArray; string/number children
  // split into spans, anything else renders untouched.
  const text = createMemo<string | null>(() => {
    const child: unknown = props.children;
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    if (Array.isArray(child) && child.every(part => typeof part === 'string' || typeof part === 'number')) {
      return (child as (string | number)[]).join('');
    }
    return null;
  });

  const shiftColor = () => {
    const from = props.fromColor ?? 'currentColor';
    return from && from !== 'currentColor' ? from : null;
  };
  const shiftStyle = createMemo<JSX.CSSProperties | undefined>(() =>
    shiftColor()
      ? { color: `color-mix(in oklab, ${shiftColor()} calc(var(--scroll-float-mix, 0) * 100%), currentColor)` }
      : undefined
  );

  const parts = createMemo<Part[] | null>(() => {
    const value = text();
    if (value === null) return null;
    return value.split(/(\s+)/).map((word, wordIndex) =>
      word.trim() === '' ? { key: wordIndex, space: word } : { key: wordIndex, chars: Array.from(word) }
    );
  });

  const effectKind = createMemo(() => props.effect ?? 'float');

  createEffect(() => {
    // Upstream deps: [mounted, scrollContainerRef, text, effect, splitBy,
    // direction, order, shiftColor, animationDuration, ease, scrollStart,
    // scrollEnd, stagger, distance, stretch, smoothing]
    const textValue = text();
    const effect = props.effect ?? 'float';
    const splitBy = props.splitBy ?? 'chars';
    const direction = props.direction ?? 'up';
    const order = props.order ?? 'start';
    const color = shiftColor();
    const animationDuration = props.animationDuration ?? 1;
    const ease = props.ease ?? 'back.inOut(2)';
    const scrollStart = props.scrollStart ?? 'center bottom+=50%';
    const scrollEnd = props.scrollEnd ?? 'bottom bottom-=40%';
    const stagger = props.stagger ?? 0.03;
    const distance = props.distance ?? 120;
    const stretch = props.stretch ?? 2.3;
    const smoothing = props.smoothing ?? 0;
    const scrollerRef = props.scrollContainerRef;

    const el = containerRef;
    const textEl = textRef;
    if (!el || !textEl) return;
    if (scrollerRef && !scrollerRef.current) return;

    const scroller = scrollerRef?.current || window;
    const pieces = el.querySelectorAll<HTMLElement>(splitBy === 'words' ? '[data-word]' : '[data-char]');
    const targets: HTMLElement[] = pieces.length ? Array.from(pieces) : [textEl];
    const indexOf = new Map<Element, number>(targets.map((target, index) => [target, index]));
    const at = (fn: (index: number) => number) => (_: number, target: Element) => fn(indexOf.get(target) ?? 0);
    const middle = (targets.length - 1) / 2;
    const edge = (index: number) => (middle > 0 ? (index - middle) / middle : 0);
    const delays = getDelays(targets.length, order, stagger);
    const sign = direction === 'down' ? -1 : 1;
    const reach = Math.max(0, Number(distance) || 0) / 120;
    const squeeze = stretch > 0 ? stretch ** -0.43 : 1;
    const baseEase = gsap.parseEase(ease) || ((p: number) => p);
    const timing = (p: number) => clamp01(baseEase(p));
    const size = () => parseFloat(getComputedStyle(textEl).fontSize) || 16;
    const swell = (p: number) => {
      const t = timing(p);
      return 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.6);
    };
    const sway = (p: number) => {
      const t = timing(p);
      return Math.sin(t * Math.PI * 2.5) * Math.pow(1 - t, 2.6);
    };
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: clampToScroll(scrollEnd),
          scrub: smoothing > 0 ? smoothing : true,
          invalidateOnRefresh: true
        }
      });
      const add = (fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => {
        gsap.set(targets, { willChange: 'opacity, transform', ...fromVars });
        return timeline.fromTo(
          targets,
          { willChange: 'opacity, transform', ...fromVars },
          { duration: animationDuration, stagger: (index: number) => delays[index] || 0, ...toVars },
          0
        );
      };

      if (effect === 'flip') {
        add(
          {
            rotationX: -90 * sign,
            transformPerspective: () => size() * 4,
            transformOrigin: () => `50% 50% ${(-size() * 0.55 * reach).toFixed(2)}`,
            backfaceVisibility: 'hidden'
          },
          { ease, rotationX: 0 }
        );
        add({ opacity: 0 }, { ease: (p: number) => smoothstep(0.05, 0.55, timing(p)), opacity: 1 });
      } else if (effect === 'scatter') {
        add(
          {
            x: at(index => ((random(index, 1) * 2 - 1) * 1.3 - edge(index) * 0.9) * size() * reach),
            y: at(index => sign * (0.35 + random(index, 2)) * size() * 1.1 * reach),
            rotation: at(index => (random(index, 3) < 0.5 ? -1 : 1) * (40 + random(index, 4) * 120)),
            scale: at(index => 0.35 + random(index, 5) * 0.9),
            transformOrigin: '50% 50%'
          },
          { ease, x: 0, y: 0, rotation: 0, scale: 1 }
        );
        add({ opacity: 0 }, { ease: (p: number) => smoothstep(0, 0.4, timing(p)), opacity: 1 });
      } else if (effect === 'blur') {
        add(
          {
            willChange: 'opacity, transform, filter',
            opacity: 0,
            y: () => sign * size() * 0.3 * reach,
            scale: 1.45,
            filter: () => `blur(${(size() * 0.2).toFixed(2)}px)`,
            transformOrigin: '50% 50%'
          },
          { ease, opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
        );
      } else if (effect === 'wave') {
        add(
          {
            yPercent: 120 * reach * sign,
            scaleY: stretch,
            scaleX: squeeze,
            transformOrigin: sign > 0 ? '50% 100%' : '50% 0%'
          },
          { ease: swell, yPercent: 0, scaleY: 1, scaleX: 1 }
        );
        add({ rotation: 0 }, { ease: sway, rotation: -16 * sign });
        add({ opacity: 0 }, { ease: (p: number) => clamp01(timing(p) * 2.5), opacity: 1 });
      } else {
        add(
          {
            opacity: 0,
            yPercent: 120 * reach * sign,
            scaleY: stretch,
            scaleX: squeeze,
            transformOrigin: sign > 0 ? '50% 0%' : '50% 100%'
          },
          { ease, opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1 }
        );
      }

      if (color) {
        add(
          { '--scroll-float-mix': 1 },
          { ease: (p: number) => smoothstep(0.5, 1, timing(p)), '--scroll-float-mix': 0 }
        );
      }
    });

    onCleanup(() => mm.revert());
  });

  return (
    <h2
      ref={containerRef}
      class={`my-5 ${effectKind() === 'float' ? 'overflow-hidden' : 'overflow-x-clip overflow-y-visible'} ${props.containerClassName ?? ''}`}
    >
      <Show when={text() !== null}>
        <span class="sr-only">{text()}</span>
      </Show>
      <span
        ref={textRef}
        class={`inline-block text-[clamp(1.6rem,8vw,10rem)] font-black text-center leading-[1.5] ${props.textClassName ?? ''}`}
        style={text() === null ? shiftStyle() : undefined}
        aria-hidden={text() !== null ? true : undefined}
      >
        <Show
          when={parts() !== null}
          fallback={props.children}
        >
          <For each={parts() ?? []}>
            {(part) =>
              part.space !== undefined ? (
                part.space
              ) : (
                <span class="inline-block whitespace-nowrap" data-word>
                  <For each={part.chars ?? []}>
                    {(char) => (
                      <span class="inline-block" data-char style={shiftStyle()}>
                        {char}
                      </span>
                    )}
                  </For>
                </span>
              )
            }
          </For>
        </Show>
      </span>
    </h2>
  );
};

export default ScrollFloat;
