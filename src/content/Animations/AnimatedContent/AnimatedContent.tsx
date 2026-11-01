import { createEffect, onCleanup, splitProps, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type AnimatedContentWipe = 'none' | 'up' | 'down' | 'left' | 'right' | 'center';
export type AnimatedContentStaggerFrom = 'start' | 'end' | 'center' | 'edges' | 'random';

export interface AnimatedContentProps
  extends Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'onAnimationStart' | 'children' | 'class' | 'className' | 'style' | 'ref'
  > {
  children?: JSX.Element;
  container?: Element | string | null;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  blur?: number;
  rotate?: number;
  tilt?: number;
  wipe?: AnimatedContentWipe;
  threshold?: number;
  delay?: number;
  stagger?: number;
  staggerFrom?: AnimatedContentStaggerFrom;
  trigger?: 'scroll' | 'mount';
  once?: boolean;
  scrub?: boolean | number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  className?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

const WIPES: Record<string, string> = {
  up: 'linear-gradient(to top, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  down: 'linear-gradient(to bottom, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  left: 'linear-gradient(to left, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  right: 'linear-gradient(to right, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  center:
    'radial-gradient(farthest-corner at 50% 50%, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))'
};

const AnimatedContent = (props: AnimatedContentProps) => {
  const [own, rest] = splitProps(props, ['children', 'class', 'className', 'style']);
  let root!: HTMLDivElement;

  createEffect(() => {
    // Every entry of upstream's dependency array is read up front so the effect
    // re-runs on exactly the same prop changes.
    const container = props.container;
    const distance = props.distance ?? 100;
    const direction = props.direction ?? 'vertical';
    const reverse = props.reverse ?? false;
    const duration = props.duration ?? 0.8;
    const ease = props.ease ?? 'power3.out';
    const initialOpacity = props.initialOpacity ?? 0;
    const animateOpacity = props.animateOpacity ?? true;
    const scale = props.scale ?? 1;
    const blur = props.blur ?? 0;
    const rotate = props.rotate ?? 0;
    const tilt = props.tilt ?? 0;
    const wipe = props.wipe ?? 'none';
    const threshold = props.threshold ?? 0.1;
    const delay = props.delay ?? 0;
    const stagger = props.stagger ?? 0;
    const staggerFrom = props.staggerFrom ?? 'start';
    const trigger = props.trigger ?? 'scroll';
    const once = props.once ?? true;
    const scrub = props.scrub ?? false;
    const disappearAfter = props.disappearAfter ?? 0;
    const disappearDuration = props.disappearDuration ?? 0.5;
    const disappearEase = props.disappearEase ?? 'power3.in';

    const el = root;
    if (!el) return;

    let scroller: Element | string | null = container || document.getElementById('snap-main-container') || null;
    if (typeof scroller === 'string') scroller = document.querySelector(scroller);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // Upstream kept the latest callbacks in a ref so swapping them never rebuilt
    // the timeline; untracked reads at call time have the same semantics.
    const ctx = gsap.context(() => {
      const targets: Element[] = stagger > 0 && el.children.length ? Array.from(el.children) : [el];
      const horizontal = direction === 'horizontal';
      const axis = horizontal ? 'x' : 'y';
      const sign = reverse ? -1 : 1;
      const mask = WIPES[wipe];

      gsap.set(el, { visibility: 'visible' });

      if (reduce) {
        untrack(() => props.onComplete?.());
        return;
      }

      const from: gsap.TweenVars = {
        [axis]: distance * sign,
        scale,
        opacity: animateOpacity ? initialOpacity : 1
      };
      const to: gsap.TweenVars = {
        [axis]: 0,
        scale: 1,
        opacity: 1,
        duration,
        ease
      };

      if (blur > 0) {
        from.filter = `blur(${blur}px)`;
        to.filter = 'blur(0px)';
      }
      if (rotate) {
        from.rotation = rotate * sign;
        to.rotation = 0;
      }
      if (tilt) {
        const tiltAxis = horizontal ? 'rotationY' : 'rotationX';
        from[tiltAxis] = horizontal ? -tilt * sign : tilt * sign;
        to[tiltAxis] = 0;
        from.transformPerspective = 900;
        to.transformPerspective = 900;
      }
      if (mask) {
        gsap.set(targets, { maskImage: mask, webkitMaskImage: mask });
        from['--ac-wipe'] = 0;
        to['--ac-wipe'] = 1;
      }
      if (stagger > 0) to.stagger = { each: stagger, from: staggerFrom };

      const settle = () => {
        if (scrub) return;
        gsap.set(targets, { clearProps: mask ? 'filter,transform,maskImage,webkitMaskImage' : 'filter,transform' });
      };

      const disappear = () => {
        if (disappearAfter <= 0) return;
        const out: gsap.TweenVars = {
          [axis]: -distance * sign,
          scale: 0.8,
          opacity: animateOpacity ? initialOpacity : 0,
          delay: disappearAfter,
          duration: disappearDuration,
          ease: disappearEase,
          onComplete: () => untrack(() => props.onDisappearanceComplete?.())
        };
        if (blur > 0) out.filter = `blur(${blur}px)`;
        if (stagger > 0) out.stagger = { each: stagger, from: staggerFrom };
        gsap.to(targets, out);
      };

      const tl = gsap.timeline({
        paused: true,
        onStart: () => untrack(() => props.onStart?.()),
        onComplete: () => {
          untrack(() => props.onComplete?.());
          settle();
          if (once && !scrub) disappear();
        }
      });
      tl.fromTo(targets, from, to, scrub ? 0 : Math.max(delay, 0));

      if (trigger === 'mount') {
        tl.play();
        return;
      }

      const start = `top ${(1 - threshold) * 100}%`;

      if (scrub) {
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start,
          end: `top ${Math.max((1 - threshold) * 100 - 45, 5)}%`,
          scrub: scrub === true ? true : Math.max(Number(scrub) || 0, 0.01),
          animation: tl
        });
        return;
      }

      ScrollTrigger.create({
        trigger: el,
        scroller,
        start,
        once,
        onEnter: () => tl.play(),
        onLeaveBack: once
          ? undefined
          : () => {
              if (mask) gsap.set(targets, { maskImage: mask, webkitMaskImage: mask });
              tl.reverse();
            }
      });
    }, el);

    onCleanup(() => ctx.revert());
  });

  return (
    <div
      ref={root}
      class={['invisible', own.class, own.className].filter(Boolean).join(' ')}
      style={own.style}
      {...rest}
    >
      {own.children}
    </div>
  );
};

export default AnimatedContent;
