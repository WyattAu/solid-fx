import { createEffect, createMemo, For, onCleanup, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SCRUB_SPAN = 0.5;
const RISE_MASK = 'inset(-1em -1em -0.15em -1em)';

type RevealSplit = 'words' | 'chars' | 'lines';
type RevealEffect = 'fade' | 'rise' | 'flip' | 'scale';
type RevealMode = 'scrub' | 'enter';

export interface ScrollRevealProps {
  children: JSX.Element;
  // PORT-NOTE: React's RefObject<HTMLElement | null> became an element or a
  // getter resolving to it (Solid idiom) — pass the scroller element directly
  // or `() => scrollerEl`.
  scrollContainerRef?: HTMLElement | (() => HTMLElement | null | undefined) | null;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  baseOffset?: number;
  stagger?: number;
  smoothing?: number;
  splitBy?: RevealSplit;
  effect?: RevealEffect;
  mode?: RevealMode;
  duration?: number;
  highlightColor?: string;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  className?: string;
  class?: string;
}

interface RevealLook {
  effect: RevealEffect;
  masked: boolean;
  baseOpacity: number;
  blur: number;
  offset: number;
  highlightColor: string;
}

const clampToScroll = (position: string) =>
  typeof position === 'string' && !position.startsWith('clamp(') ? `clamp(${position})` : position;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const smooth = (value: number) => value * value * (3 - 2 * value);
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
const easeBack = (value: number, overshoot: number) => {
  const shifted = value - 1;
  return 1 + (overshoot + 1) * shifted * shifted * shifted + overshoot * shifted * shifted;
};
const glowAt = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.35 ? smooth(t / 0.35) : 1 - smooth((t - 0.35) / 0.65));

const paintPiece = (piece: HTMLElement, t: number, look: RevealLook) => {
  let reveal = t;
  let fadeIn = t;
  let motion = '';
  if (look.effect === 'rise') {
    reveal = easeOut(t);
    fadeIn = clamp01(reveal * 1.25);
    if (reveal < 1) {
      motion = look.masked
        ? `translateY(${((1 - reveal) * 100).toFixed(2)}%) translateY(${((1 - reveal) * 0.2).toFixed(3)}em)`
        : `translateY(${((1 - reveal) * 0.8).toFixed(3)}em)`;
    }
  } else if (look.effect === 'flip') {
    reveal = easeBack(t, 1.2);
    fadeIn = clamp01(t * 2);
    if (t < 1) motion = `perspective(6em) rotateX(${((1 - reveal) * 90).toFixed(2)}deg)`;
  } else if (look.effect === 'scale') {
    reveal = easeBack(t, 1.6);
    fadeIn = clamp01(t * 1.6);
    if (t < 1) motion = `scale(${(0.35 + 0.65 * reveal).toFixed(4)})`;
  }
  if (look.highlightColor) fadeIn = Math.max(fadeIn, clamp01(t / 0.35));
  const settle = clamp01(reveal);
  const lift = look.offset * (1 - settle);
  piece.style.opacity = t >= 1 ? '' : (look.baseOpacity + (1 - look.baseOpacity) * fadeIn).toFixed(3);
  piece.style.transform = [lift ? `translateY(${lift.toFixed(2)}px)` : '', motion].filter(Boolean).join(' ');
  piece.style.filter = look.blur && settle < 1 ? `blur(${(look.blur * (1 - settle)).toFixed(2)}px)` : '';
  if (look.highlightColor) {
    const glow = glowAt(t);
    piece.style.color =
      glow > 0.002 ? `color-mix(in srgb, ${look.highlightColor} ${(glow * 100).toFixed(1)}%, currentColor)` : '';
  }
};

const ScrollReveal = (props: ScrollRevealProps) => {
  let containerEl!: HTMLHeadingElement;
  let textEl!: HTMLSpanElement;

  // PORT-NOTE: upstream used Children.toArray to detect plain-text children;
  // Solid children arrive as strings/numbers/arrays/DOM nodes, so the same
  // check runs on the raw children value.
  const text = createMemo<string | null>(() => {
    const parts = props.children as unknown;
    if (typeof parts === 'string' || typeof parts === 'number') return String(parts);
    if (Array.isArray(parts) && parts.every(part => typeof part === 'string' || typeof part === 'number')) {
      return (parts as (string | number)[]).join('');
    }
    return null;
  });

  const words = createMemo(() => (text() === null ? [] : text()!.split(/(\s+)/)));

  createEffect(() => {
    // Upstream deps: [mounted, scrollContainerRef, text, splitBy, effect, mode,
    // duration, highlightColor, enableBlur, baseOpacity, baseRotation,
    // blurStrength, baseOffset, stagger, smoothing, rotationEnd,
    // wordAnimationEnd]. (mounted is implicit: Solid effects run post-mount.)
    const scrollerValue =
      typeof props.scrollContainerRef === 'function' ? props.scrollContainerRef() : props.scrollContainerRef;
    const textNow = text();
    const splitBy = props.splitBy ?? 'words';
    const effect = props.effect ?? 'fade';
    const mode = props.mode ?? 'scrub';
    const duration = props.duration ?? 0.8;
    const highlightColor = props.highlightColor ?? '';
    const enableBlur = props.enableBlur ?? true;
    const baseOpacity = props.baseOpacity ?? 0.1;
    const baseRotation = props.baseRotation ?? 3;
    const blurStrength = props.blurStrength ?? 4;
    const baseOffset = props.baseOffset ?? 0;
    const stagger = props.stagger ?? 0.05;
    const smoothing = props.smoothing ?? 0;
    const rotationEnd = props.rotationEnd ?? 'bottom bottom';
    const wordAnimationEnd = props.wordAnimationEnd ?? 'bottom bottom';

    const el = containerEl;
    const textNode = textEl;
    if (!el || !textNode) return;
    if (props.scrollContainerRef && !scrollerValue) return;

    const scroller: HTMLElement | Window = scrollerValue || window;
    const wrappers = Array.from(el.querySelectorAll<HTMLElement>('[data-word]'));
    const pieces = wrappers.length ? Array.from(el.querySelectorAll<HTMLElement>('[data-piece]')) : [textNode];
    const viewportHeight = () => (scroller instanceof HTMLElement ? scroller.clientHeight : window.innerHeight);
    const scrub = smoothing > 0 ? smoothing : true;
    const span = mode === 'enter' ? Math.max(0.05, duration) : SCRUB_SPAN;
    const gap = Math.max(0, stagger);
    const look: RevealLook = {
      effect,
      masked: effect === 'rise' && wrappers.length > 0,
      baseOpacity,
      blur: enableBlur ? blurStrength : 0,
      offset: baseOffset,
      highlightColor
    };
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const order = pieces.map((_, index) => index);
      const last = pieces.map(() => -1);
      const state = { p: 0 };
      let count = pieces.length;

      const measure = () => {
        if (splitBy !== 'lines' || !wrappers.length) return;
        let line = -1;
        let top = -Infinity;
        wrappers.forEach((wrapper, index) => {
          const next = wrapper.offsetTop;
          if (Math.abs(next - top) > 2) {
            line += 1;
            top = next;
          }
          order[index] = line;
        });
        count = line + 1;
      };

      const total = () => span + Math.max(0, count - 1) * gap;

      const render = () => {
        const at = state.p * total();
        pieces.forEach((piece, index) => {
          const t = clamp01((at - order[index] * gap) / span);
          if (t === last[index]) return;
          last[index] = t;
          paintPiece(piece, t, look);
        });
      };

      measure();
      pieces.forEach(piece => {
        piece.style.willChange =
          pieces.length > 80 ? '' : effect === 'fade' && !baseOffset ? 'opacity' : 'opacity, transform';
        piece.style.transformOrigin = effect === 'flip' ? '50% 100%' : '';
      });
      if (look.masked) {
        wrappers.forEach(wrapper => {
          wrapper.style.clipPath = RISE_MASK;
        });
      }
      render();

      if (mode === 'enter') {
        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          gsap.to(state, { p: 1, duration: total(), ease: 'none', onUpdate: render });
          if (baseRotation) gsap.to(el, { rotate: 0, duration: Math.min(total(), 1.4), ease: 'power3.out' });
        };
        const startAt = () => {
          const view = viewportHeight();
          const top =
            el.getBoundingClientRect().top -
            (scroller instanceof HTMLElement
              ? scroller.getBoundingClientRect().top + scroller.clientTop - scroller.scrollTop
              : -window.scrollY);
          const raw = top - view + 0.2 * Math.min(el.offsetHeight, view);
          return Math.min(raw, ScrollTrigger.maxScroll(scroller) - 1);
        };
        if (baseRotation) gsap.set(el, { transformOrigin: '0% 50%', rotate: baseRotation });
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start: startAt,
          onEnter: play,
          onLeave: play,
          onRefresh: (self: ScrollTrigger) => {
            if (self.progress > 0) play();
          }
        });
      } else {
        if (baseRotation) {
          gsap.fromTo(
            el,
            { transformOrigin: '0% 50%', rotate: baseRotation },
            {
              ease: 'none',
              rotate: 0,
              scrollTrigger: {
                trigger: el,
                scroller,
                start: 'top bottom',
                end: clampToScroll(rotationEnd),
                scrub
              }
            }
          );
        }
        gsap.to(state, {
          p: 1,
          ease: 'none',
          onUpdate: render,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: () => `top bottom-=${0.2 * Math.min(el.offsetHeight, viewportHeight())}`,
            end: clampToScroll(wordAnimationEnd),
            scrub
          }
        });
      }

      const resizeObserver =
        splitBy === 'lines' && typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(() => {
              measure();
              last.fill(-1);
              render();
            })
          : null;
      resizeObserver?.observe(textNode);

      return () => {
        resizeObserver?.disconnect();
        pieces.forEach(piece => {
          piece.style.opacity = '';
          piece.style.transform = '';
          piece.style.transformOrigin = '';
          piece.style.filter = '';
          piece.style.color = '';
          piece.style.willChange = '';
        });
        wrappers.forEach(wrapper => {
          wrapper.style.clipPath = '';
        });
      };
    });

    onCleanup(() => mm.revert());
  });

  return (
    <h2
      ref={containerEl}
      class={`my-5 ${props.class ?? ''} ${props.containerClassName ?? ''}`}
      aria-label={text() ?? undefined}
    >
      <span
        ref={textEl}
        class={`block text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold ${props.textClassName ?? ''}`}
        aria-hidden={text() === null ? undefined : true}
      >
        <Show when={text() !== null} fallback={props.children}>
          <For each={words()}>
            {(item) =>
              item.trim() === '' ? (
                item
              ) : (
                <span class="inline-block" data-word>
                  <Show
                    when={props.splitBy === 'chars'}
                    fallback={
                      <span class="inline-block" data-piece>
                        {item}
                      </span>
                    }
                  >
                    <For each={Array.from(item)}>
                      {(char) => (
                        <span class="inline-block" data-piece>
                          {char}
                        </span>
                      )}
                    </For>
                  </Show>
                </span>
              )
            }
          </For>
        </Show>
      </span>
    </h2>
  );
};

export default ScrollReveal;
