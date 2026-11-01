import { createEffect, createMemo, onCleanup, For } from 'solid-js';
import type { JSX } from 'solid-js';

export interface InfiniteSpiralItem {
  id?: string | number;
  src: string;
  alt?: string;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  label?: string;
}

export interface InfiniteSpiralProps {
  items?: Array<string | InfiniteSpiralItem>;
  speed?: number;
  direction?: 'up' | 'down';
  animationMode?: 'auto' | 'drag' | 'scroll' | 'all';
  radius?: number;
  cardWidth?: number;
  cardHeight?: number;
  verticalSpacing?: number;
  perspective?: number;
  cardsPerTurn?: number;
  rotation?: number;
  cardTilt?: number;
  cardRadius?: number;
  centerScale?: number;
  edgeFade?: number;
  edgeBlur?: number;
  pauseOnHover?: boolean;
  imageFit?: JSX.CSSProperties['object-fit'];
  grayscale?: number;
  className?: string;
  class?: string;
}

type NormalizedItem = InfiniteSpiralItem & { alt: string };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const modulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
const smoothstep = (min: number, max: number, value: number) => {
  const x = clamp((value - min) / (max - min || 1), 0, 1);
  return x * x * (3 - 2 * x);
};

const InfiniteSpiral = (props: InfiniteSpiralProps) => {
  let rootEl!: HTMLDivElement;
  const cardEls: (HTMLAnchorElement | HTMLDivElement | null)[] = [];
  let progress = 0;
  let targetProgress = 0;
  let autoSpeed = 0;
  let hovered = false;
  let visible = true;
  let dragging = false;
  let lastPointerY = 0;
  let dragMoved = false;

  const normalizedItems = createMemo<NormalizedItem[]>(() =>
    (props.items ?? []).map((item, index) =>
      typeof item === 'string'
        ? { src: item, alt: `Spiral image ${index + 1}` }
        : { alt: `Spiral image ${index + 1}`, ...item }
    )
  );

  createEffect(() => {
    const root = rootEl;
    const normalized = normalizedItems();
    const speed = props.speed ?? 0.55;
    const direction = props.direction ?? 'up';
    const animationMode = props.animationMode ?? 'auto';
    const radius = props.radius ?? 170;
    const perspective = props.perspective ?? 1000;
    const cardWidth = props.cardWidth ?? 100;
    const cardHeight = props.cardHeight ?? 100;
    const verticalSpacing = props.verticalSpacing ?? 60;
    const cardsPerTurn = props.cardsPerTurn ?? 7;
    const rotation = props.rotation ?? 0;
    const cardTilt = props.cardTilt ?? 0;
    const centerScale = props.centerScale ?? 1.2;
    const edgeFade = props.edgeFade ?? 0.3;
    const edgeBlur = props.edgeBlur ?? 6;
    const pauseOnHover = props.pauseOnHover ?? true;
    if (!root || normalized.length === 0) return;

    let frameId = 0;
    let previousTime = performance.now();
    let bounds = root.getBoundingClientRect();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollEnabled = animationMode === 'scroll' || animationMode === 'all';
    const scrollSpeedMultiplier = Math.max(speed, 0) / 0.55;
    let lastScrollY = window.scrollY;
    const resizeObserver = new ResizeObserver(() => {
      bounds = root.getBoundingClientRect();
    });
    resizeObserver.observe(root);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersectionObserver.observe(root);

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;
      if (!scrollEnabled || !visible || scrollDelta === 0) return;
      targetProgress += clamp(
        (scrollDelta * scrollSpeedMultiplier) / Math.max(verticalSpacing * 2, 1),
        -1.5,
        1.5
      );
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const render = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const autoEnabled = animationMode === 'auto' || animationMode === 'all';
      const motionPaused = dragging || (pauseOnHover && hovered);
      const directionMultiplier = direction === 'down' ? -1 : 1;
      const desiredAutoSpeed =
        autoEnabled && visible && !reducedMotion.matches && !motionPaused
          ? speed * directionMultiplier
          : 0;
      const speedBlend = 1 - Math.exp(-delta * 7);
      autoSpeed += (desiredAutoSpeed - autoSpeed) * speedBlend;
      targetProgress += autoSpeed * delta;

      const followBlend = 1 - Math.exp(-delta * (dragging ? 22 : 11));
      progress += (targetProgress - progress) * followBlend;

      const count = normalized.length;
      const half = count / 2;
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);
      const fit = Math.min(1, width / (cardWidth * 2.8), height / (cardHeight * 2.35));
      const responsiveRadius = Math.min(radius, Math.max(72, width * 0.36)) * fit;
      const fadeStart = clamp(1 - edgeFade, 0, 0.98);
      const turnSize = Math.max(cardsPerTurn, 1);

      cardEls.forEach((card, index) => {
        if (!card) return;
        const offset = modulo(index - progress + half, count) - half;
        const edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1);
        const opacity = 1 - smoothstep(fadeStart, 1, edge);
        const focus = 1 - Math.min(Math.abs(offset) / Math.max(turnSize * 0.65, 1), 1);
        const scale = (1 + (centerScale - 1) * focus) * fit;
        const angle = offset * (360 / turnSize) + rotation;
        const angleRadians = (angle * Math.PI) / 180;
        const x = Math.sin(angleRadians) * responsiveRadius;
        const z = Math.cos(angleRadians) * responsiveRadius;
        const depthScale = clamp(perspective / Math.max(perspective - z, 1), 0.72, 1.45);
        const visualScale = scale * depthScale;
        const depth = (z / Math.max(responsiveRadius, 1) + 1) / 2;
        const blur = edgeBlur * smoothstep(0.35, 1, edge);
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${offset * verticalSpacing * fit}px, 0) rotateZ(${cardTilt}deg) scale(${visualScale})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none';
        card.style.zIndex = String(Math.round(depth * 100000) + index);
        card.style.pointerEvents = opacity > 0.25 ? 'auto' : 'none';
      });
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    onCleanup(() => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    });
  });

  const dragEnabled = () => {
    const mode = props.animationMode ?? 'auto';
    return mode === 'drag' || mode === 'all';
  };

  const stopDragging = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.style.cursor = dragEnabled() ? 'grab' : 'default';
  };

  const itemClassName =
    'absolute left-1/2 top-1/2 block h-[var(--spiral-height)] w-[var(--spiral-width)] overflow-hidden rounded-[var(--spiral-radius)] border border-white/25 bg-white/10 shadow-[0_14px_38px_rgba(8,6,18,0.2)] [backface-visibility:hidden] [transform-style:preserve-3d] [will-change:transform,opacity,filter] motion-reduce:transition-none';

  return (
    <div
      ref={rootEl}
      class={`relative isolate h-full min-h-80 w-full overflow-hidden ${props.class ?? ''} ${props.className ?? ''}`}
      style={
        {
          perspective: `${props.perspective ?? 1000}px`,
          '--spiral-width': `${props.cardWidth ?? 100}px`,
          '--spiral-height': `${props.cardHeight ?? 100}px`,
          '--spiral-radius': `${props.cardRadius ?? 10}px`,
          cursor: dragEnabled() ? 'grab' : 'default',
          'touch-action': dragEnabled() ? 'pan-x' : 'auto',
          'user-select': dragEnabled() ? 'none' : 'auto'
        } as JSX.CSSProperties
      }
      onMouseEnter={() => {
        hovered = true;
      }}
      onMouseLeave={() => {
        hovered = false;
      }}
      onPointerDown={event => {
        if (!dragEnabled() || event.button !== 0) return;
        dragging = true;
        dragMoved = false;
        lastPointerY = event.clientY;
        targetProgress = progress;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.cursor = 'grabbing';
      }}
      onPointerMove={event => {
        if (!dragging) return;
        const pointerDelta = event.clientY - lastPointerY;
        lastPointerY = event.clientY;
        if (Math.abs(pointerDelta) > 0.5) dragMoved = true;
        targetProgress -= pointerDelta / Math.max(props.verticalSpacing ?? 60, 1);
      }}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onClickCapture={event => {
        if (!dragMoved) return;
        event.preventDefault();
        event.stopPropagation();
        dragMoved = false;
      }}
    >
      <div class="absolute inset-0 [transform-style:preserve-3d]" role="list" aria-label="Infinite spiral gallery">
        <For each={normalizedItems()}>
          {(item, index) => {
            const content = (
              <img
                class="absolute inset-0 block h-full w-full select-none object-center"
                src={item.src}
                alt={item.alt}
                loading={index() < 6 ? 'eager' : 'lazy'}
                draggable={false}
                style={{
                  width: `${props.cardWidth ?? 100}px`,
                  height: `${props.cardHeight ?? 100}px`,
                  'max-width': 'none',
                  'max-height': 'none',
                  'object-fit': props.imageFit ?? 'cover',
                  filter: `grayscale(${Math.min(1, Math.max(0, props.grayscale ?? 0))})`
                }}
              />
            );

            return item.href ? (
              <a
                ref={(el: HTMLAnchorElement) => {
                  cardEls[index()] = el;
                }}
                class={itemClassName}
                style={{ width: `${props.cardWidth ?? 100}px`, height: `${props.cardHeight ?? 100}px`, 'border-radius': `${props.cardRadius ?? 10}px` }}
                href={item.href}
                target={item.target}
                rel={item.target === '_blank' ? 'noreferrer' : undefined}
                role="listitem"
                aria-label={item.label ?? item.alt}
              >
                {content}
              </a>
            ) : (
              <div
                ref={(el: HTMLDivElement) => {
                  cardEls[index()] = el;
                }}
                class={itemClassName}
                style={{ width: `${props.cardWidth ?? 100}px`, height: `${props.cardHeight ?? 100}px`, 'border-radius': `${props.cardRadius ?? 10}px` }}
                role="listitem"
                aria-label={item.label ?? item.alt}
              >
                {content}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default InfiniteSpiral;
