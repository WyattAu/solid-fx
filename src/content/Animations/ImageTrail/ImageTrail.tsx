import { createEffect, onCleanup } from 'solid-js';
import { For } from 'solid-js';
import type { JSX } from 'solid-js';
import { gsap } from 'gsap';

interface ImageTrailProps {
  items?: string[];
  size?: number | string;
  aspectRatio?: number;
  radius?: number | string;
  threshold?: number;
  lifetime?: number;
  appearScale?: number;
  zoom?: number;
  flash?: number;
  exitScale?: number;
  drift?: number;
  rotation?: number;
  sizeVariance?: number;
  alignToMotion?: boolean;
  stack?: number;
  tilt?: number;
  className?: string;
  class?: string;
}

interface TrailConfig {
  threshold: number;
  lifetime: number;
  appearScale: number;
  zoom: number;
  flash: number;
  exitScale: number;
  drift: number;
  rotation: number;
  sizeVariance: number;
  alignToMotion: boolean;
  stack: number;
  tilt: number;
}

interface TrailImage {
  el: HTMLElement;
  inner: HTMLElement;
}

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

const toCssLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const createTrail = (container: HTMLDivElement, config: { current: TrailConfig }) => {
  const images: TrailImage[] = Array.from(container.querySelectorAll<HTMLElement>('[data-trail-image]')).map(el => ({
    el,
    inner: el.firstElementChild as HTMLElement
  }));
  const total = images.length;
  const query = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const mouse = { x: 0, y: 0 };
  const last = { x: 0, y: 0 };
  const cache = { x: 0, y: 0 };
  const visible: TrailImage[] = [];
  let started = false;
  let raf = 0;
  let index = -1;
  let zIndex = 1;
  let active = 0;
  let lastAngle = 0;
  let destroyed = false;

  const settle = () => {
    active = Math.max(0, active - 1);
    if (!active && !visible.length) zIndex = 1;
  };

  const retire = (img: TrailImage) => {
    const cfg = config.current;
    gsap.to(img.el, {
      duration: 0.4,
      ease: 'power4',
      opacity: 0,
      scale: cfg.exitScale,
      onComplete: () => {
        if (!active && !visible.length) zIndex = 1;
      }
    });
  };

  const spawn = () => {
    const cfg = config.current;
    if (!total) return;
    index = (index + 1) % total;
    const img = images[index];
    const width = img.el.offsetWidth;
    const height = img.el.offsetHeight;
    const dx = mouse.x - last.x;
    const dy = mouse.y - last.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    let fromAngle = gsap.utils.random(-cfg.rotation, cfg.rotation);
    let toAngle = fromAngle * 0.4;
    if (cfg.alignToMotion) {
      fromAngle = lastAngle;
      toAngle = angle;
      while (toAngle - fromAngle > 180) toAngle -= 360;
      while (toAngle - fromAngle < -180) toAngle += 360;
      lastAngle = toAngle;
    }
    const scale = 1 + gsap.utils.random(-0.5, 0.6) * cfg.sizeVariance;
    const box = container.getBoundingClientRect();
    const tiltX = box.height ? -((mouse.y - box.height / 2) / (box.height / 2)) * cfg.tilt : 0;
    const tiltY = box.width ? ((mouse.x - box.width / 2) / (box.width / 2)) * cfg.tilt : 0;
    const drift = cfg.drift > 0;
    const slide = drift ? 0.6 * cfg.drift : 0;

    ++zIndex;
    ++active;
    gsap.killTweensOf(img.el);
    gsap.killTweensOf(img.inner);
    const visibleIndex = visible.indexOf(img);
    if (visibleIndex >= 0) visible.splice(visibleIndex, 1);

    const timeline = gsap.timeline({ onComplete: settle });
    timeline.fromTo(
      img.el,
      {
        opacity: 1,
        scale: cfg.appearScale * scale,
        zIndex,
        x: cache.x - width / 2,
        y: cache.y - height / 2,
        rotation: fromAngle,
        rotationX: tiltX * 0.5,
        rotationY: tiltY * 0.5
      },
      {
        duration: drift ? 0.9 : 0.4,
        ease: drift ? 'power2' : 'power1',
        scale,
        x: mouse.x - width / 2 + dx * slide,
        y: mouse.y - height / 2 + dy * slide,
        rotation: toAngle,
        rotationX: tiltX,
        rotationY: tiltY
      },
      0
    );
    if (cfg.zoom !== 1 || cfg.flash > 0) {
      timeline.fromTo(
        img.inner,
        { scale: cfg.zoom, filter: `brightness(${1 + cfg.flash * 1.5})` },
        { duration: 0.5, ease: 'power1', scale: 1, filter: 'brightness(1)' },
        0
      );
    }

    if (cfg.stack > 0) {
      visible.push(img);
      const keep = Math.max(1, Math.min(Math.round(cfg.stack), total - 1));
      while (visible.length > keep) {
        const old = visible.shift();
        if (old) retire(old);
      }
      return;
    }

    timeline.to(
      img.el,
      {
        duration: 0.4,
        ease: drift ? 'expo' : 'power3',
        opacity: 0,
        scale: cfg.exitScale * scale
      },
      cfg.lifetime
    );
    if (drift) {
      timeline.to(
        img.el,
        {
          duration: 1.5,
          ease: 'power4',
          x: `+=${dx * cfg.drift * 1.2}`,
          y: `+=${dy * cfg.drift * 1.2}`
        },
        cfg.lifetime
      );
    }
  };

  const loop = () => {
    raf = 0;
    if (destroyed) return;
    const cfg = config.current;
    cache.x = lerp(cache.x, mouse.x, 0.1);
    cache.y = lerp(cache.y, mouse.y, 0.1);
    if (!query?.matches && Math.hypot(mouse.x - last.x, mouse.y - last.y) > cfg.threshold) {
      spawn();
      last.x = mouse.x;
      last.y = mouse.y;
    }
    if (Math.abs(cache.x - mouse.x) > 0.5 || Math.abs(cache.y - mouse.y) > 0.5) {
      raf = requestAnimationFrame(loop);
    }
  };

  const onMove = (e: MouseEvent | TouchEvent) => {
    const rect = container.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : e;
    if (!point) return;
    mouse.x = point.clientX - rect.left;
    mouse.y = point.clientY - rect.top;
    if (!started) {
      started = true;
      cache.x = last.x = mouse.x;
      cache.y = last.y = mouse.y;
    }
    if (!raf) raf = requestAnimationFrame(loop);
  };

  container.addEventListener('mousemove', onMove);
  container.addEventListener('touchmove', onMove, { passive: true });

  return () => {
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    container.removeEventListener('mousemove', onMove);
    container.removeEventListener('touchmove', onMove);
    images.forEach(img => {
      gsap.killTweensOf(img.el);
      gsap.killTweensOf(img.inner);
    });
  };
};

export default function ImageTrail(props: ImageTrailProps) {
  let container!: HTMLDivElement;
  const config: { current: TrailConfig } = { current: {} as TrailConfig };

  // Upstream refreshed `config.current` on every render; the engine reads it
  // lazily inside its rAF loop, so re-assigning on prop change is equivalent.
  createEffect(() => {
    config.current = {
      threshold: props.threshold ?? 80,
      lifetime: props.lifetime ?? 0.4,
      appearScale: props.appearScale ?? 1,
      zoom: props.zoom ?? 1,
      flash: props.flash ?? 0,
      exitScale: props.exitScale ?? 0.2,
      drift: props.drift ?? 0,
      rotation: props.rotation ?? 0,
      sizeVariance: props.sizeVariance ?? 0,
      alignToMotion: props.alignToMotion ?? false,
      stack: props.stack ?? 0,
      tilt: props.tilt ?? 0
    };
  });

  createEffect(() => {
    // Upstream rebuilt the trail only when the items array changed.
    void props.items;
    if (!container) return;
    const dispose = createTrail(container, config);
    onCleanup(dispose);
  });

  return (
    <div
      ref={container}
      class={`relative z-[100] h-full w-full overflow-visible rounded-lg bg-transparent ${props.className ?? ''} ${props.class ?? ''}`.trim()}
      style={
        {
          '--trail-size': toCssLength(props.size ?? 190),
          '--trail-aspect': String(props.aspectRatio ?? 1.1),
          '--trail-radius': toCssLength(props.radius ?? 15),
          perspective: (props.tilt ?? 0) ? '1000px' : undefined
        } as JSX.CSSProperties
      }
    >
      <For each={props.items ?? []}>
        {url => (
          <div
            class="pointer-events-none absolute left-0 top-0 aspect-[var(--trail-aspect)] w-[var(--trail-size)] overflow-hidden rounded-[var(--trail-radius)] opacity-0 [will-change:transform,filter]"
            data-trail-image=""
          >
            <div
              class="absolute left-[-10px] top-[-10px] h-[calc(100%+20px)] w-[calc(100%+20px)] bg-cover bg-center"
              style={{ 'background-image': `url(${url})` }}
            />
          </div>
        )}
      </For>
    </div>
  );
}
