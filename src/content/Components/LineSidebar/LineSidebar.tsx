import { createEffect, onCleanup, createSignal, For, Show } from 'solid-js';
import type { JSX } from 'solid-js';

type Falloff = 'linear' | 'smooth' | 'sharp';

export interface LineSidebarProps {
  items?: string[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  defaultActive?: number | null;
  onItemClick?: (index: number, label: string) => void;
  className?: string;
  class?: string;
}

const FALLOFF_CURVES: Record<Falloff, (p: number) => number> = {
  linear: p => p,
  smooth: p => p * p * (3 - 2 * p),
  sharp: p => p * p * p
};

const DEFAULT_ITEMS = [
  'Overview',
  'Components',
  'Animations',
  'Backgrounds',
  'Showcase',
  'Playground',
  'Templates',
  'Changelog',
  'Community',
  'Resources',
  'Documentation',
  'Support'
];

const LineSidebar = (props: LineSidebarProps) => {
  let listEl: HTMLUListElement | undefined;
  const itemEls: (HTMLLIElement | null)[] = [];
  const targets: number[] = [];
  const current: number[] = [];
  let raf: number | null = null;
  let last = 0;
  const [activeIndex, setActiveIndex] = createSignal<number | null>(props.defaultActive ?? null);
  const items = () => props.items ?? DEFAULT_ITEMS;

  // Single rAF loop that eases every item's --effect toward its target using
  // frame-rate independent exponential smoothing, so color, shift and scale
  // all move together without staggering CSS transitions.
  const runFrame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const tau = Math.max(props.smoothing ?? 100, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    for (let i = 0; i < itemEls.length; i++) {
      const el = itemEls[i];
      if (!el) continue;
      const target = Math.max(targets[i] || 0, activeIndex() === i ? 1 : 0);
      const cur = current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      current[i] = value;
      el.style.setProperty('--effect', value.toFixed(4));
      if (!settled) moving = true;
    }

    raf = moving ? requestAnimationFrame(runFrame) : null;
  };

  const startLoop = () => {
    if (raf != null) {
      cancelAnimationFrame(raf);
    }
    last = performance.now();
    raf = requestAnimationFrame(runFrame);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const list = listEl;
    if (!list) return;
    const rect = list.getBoundingClientRect();
    const pointerY = e.clientY - rect.top;
    const falloff = props.falloff ?? 'smooth';
    const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
    const radius = props.proximityRadius ?? 100;
    for (let i = 0; i < itemEls.length; i++) {
      const el = itemEls[i];
      if (!el) continue;
      const center = el.offsetTop + el.offsetHeight / 2;
      const distance = Math.abs(pointerY - center);
      targets[i] = ease(Math.max(0, 1 - distance / radius));
    }
    startLoop();
  };

  const handlePointerLeave = () => {
    for (let i = 0; i < targets.length; i++) targets[i] = 0;
    startLoop();
  };

  const handleClick = (index: number, label: string) => {
    setActiveIndex(index);
    props.onItemClick?.(index, label);
  };

  createEffect(() => {
    activeIndex();
    startLoop();
  });

  onCleanup(() => {
    if (raf != null) cancelAnimationFrame(raf);
    raf = null;
  });

  const showMarker = () => props.showMarker ?? true;
  const tickClass = () =>
    showMarker()
      ? `after:absolute after:left-[calc(-1*var(--marker-length)-var(--marker-gap))] after:top-[calc(100%+var(--item-gap)/2)] after:h-px after:opacity-50 after:content-[''] last:after:content-none after:[background-color:var(--marker-color)] after:[width:calc(var(--marker-length)*var(--tick-scale))] ${
          props.scaleTick ?? true
            ? "after:origin-left after:[transform:translateY(-50%)_scaleX(calc(0.7+var(--effect,0)*0.6))]"
            : 'after:-translate-y-1/2'
        }`
      : '';

  return (
    <nav
      class={`relative flex justify-start${showMarker() ? ' [padding-left:calc(var(--marker-length)+var(--marker-gap))]' : ''}${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      style={
        {
          '--accent-color': props.accentColor ?? '#A855F7',
          '--text-color': props.textColor ?? '#c4c4c4',
          '--marker-color': props.markerColor ?? '#6c6c6c',
          '--marker-length': `${props.markerLength ?? 60}px`,
          '--marker-gap': `${props.markerGap ?? 0}px`,
          '--tick-scale': props.tickScale ?? 0.5,
          '--max-shift': `${props.maxShift ?? 30}px`,
          '--item-gap': `${props.itemGap ?? 20}px`,
          '--font-size': `${props.fontSize ?? 1.1}rem`,
          '--smoothing': `${props.smoothing ?? 100}ms`
        } as JSX.CSSProperties
      }
    >
      <ul
        ref={listEl}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        class="m-0 flex list-none flex-col py-4 [gap:var(--item-gap)]"
      >
        <For each={items()}>
          {(label, index) => (
            <li
              ref={(el: HTMLLIElement) => {
                itemEls[index()] = el;
              }}
              aria-current={activeIndex() === index() ? 'true' : undefined}
              onClick={() => handleClick(index(), label)}
              class={`relative cursor-pointer before:absolute before:-inset-x-12 before:-inset-y-[6px] before:content-[''] ${tickClass()}`}
            >
              <Show when={showMarker()}>
                <span
                  aria-hidden="true"
                  class="absolute left-[calc(-1*var(--marker-length)-var(--marker-gap))] top-1/2 h-px w-[length:var(--marker-length)] origin-left [background-color:color-mix(in_srgb,var(--accent-color)_calc(var(--effect,0)*100%),var(--marker-color))] [transform:translateY(-50%)_scaleX(calc(0.7+var(--effect,0)*0.5))]"
                />
              </Show>
              <span class="relative inline-flex items-baseline leading-[1.2] [color:color-mix(in_srgb,var(--accent-color)_calc(var(--effect,0)*100%),var(--text-color))] [font-size:var(--font-size)] [transform:translateX(calc(var(--effect,0)*var(--max-shift)))]">
                <Show when={props.showIndex ?? true}>
                  <span class="mr-[0.6rem] font-mono text-[0.85em] [opacity:calc(0.55+var(--effect,0)*0.45)]">
                    {String(index() + 1).padStart(2, '0')}
                  </span>
                </Show>
                <span>{label}</span>
              </span>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
};

export default LineSidebar;
