import { createEffect, createMemo, createSignal, createUniqueId, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import HugeiconsIcon from '@/lib/HugeiconsIcon';
import type { HugeiconsIconProps } from '@/lib/HugeiconsIcon';
import {
  CodeIcon,
  FigmaIcon,
  File01Icon,
  FileZipIcon,
  Folder01Icon,
  Image01Icon,
  MusicNote01Icon,
  Note01Icon,
  Pdf01Icon,
  Presentation01Icon,
  Table01Icon,
  Video01Icon
} from '@hugeicons/core-free-icons';

// IconSvgObject is not exported by @hugeicons/core-free-icons; derive the same
// shape from the shared HugeiconsIcon component's props (its `icon` type).
type IconSvgObject = HugeiconsIconProps['icon'];

export interface AnimatedListEntry {
  id?: string | number;
  icon?: JSX.Element;
  image?: string;
  title: JSX.Element;
  description?: JSX.Element;
  meta?: JSX.Element;
}

export type AnimatedListItem = string | AnimatedListEntry;

type Animation = 'pop' | 'slide' | 'fade';
type State = 'in' | 'above' | 'below';

interface AnimatedListProps {
  items?: AnimatedListItem[];
  onItemSelect?: (item: AnimatedListItem, index: number) => void;
  renderItem?: (item: AnimatedListItem, index: number, isSelected: boolean) => JSX.Element;
  initialSelectedIndex?: number;
  selectOnHover?: boolean;
  enableArrowNavigation?: boolean;
  loop?: boolean;
  animation?: Animation | 'none';
  animateOnce?: boolean;
  stagger?: number;
  showGradients?: boolean;
  fadeSize?: number;
  displayScrollbar?: boolean;
  frame?: boolean;
  theme?: 'dark' | 'light';
  accentColor?: string;
  radius?: number;
  gap?: number;
  width?: number | string;
  maxHeight?: number | string;
  className?: string;
  class?: string;
  itemClassName?: string;
  style?: JSX.CSSProperties;
}

interface Engine {
  place: (snap: boolean) => void;
  syncRing: () => void;
  updateFades: () => void;
  sync: () => void;
}

const THEMES: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--al-frame': 'rgba(38, 35, 46, 0.66)',
    '--al-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--al-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--al-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--al-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--al-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--al-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--al-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--al-well': 'rgba(255, 255, 255, 0.08)',
    '--al-ink': '#f4f4f5',
    '--al-muted': 'rgba(244, 244, 245, 0.55)',
    '--al-thumb': 'rgba(255, 255, 255, 0.16)',
    '--al-ring': 'rgba(244, 244, 245, 0.3)',
    '--al-ring-fill': 'rgba(244, 244, 245, 0.05)',
    '--al-hover': 'brightness(1.12)',
    '--al-press': 'brightness(0.85)',
    '--al-active': 'brightness(1.16)'
  },
  light: {
    '--al-frame': 'rgba(240, 240, 243, 0.8)',
    '--al-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--al-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--al-frame-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--al-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--al-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--al-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--al-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--al-well': 'rgba(24, 24, 27, 0.05)',
    '--al-ink': '#27272a',
    '--al-muted': 'rgba(39, 39, 42, 0.55)',
    '--al-thumb': 'rgba(24, 24, 27, 0.16)',
    '--al-ring': 'rgba(24, 24, 27, 0.28)',
    '--al-ring-fill': 'transparent',
    '--al-hover': 'brightness(0.97)',
    '--al-press': 'brightness(0.92)',
    '--al-active': 'none'
  }
};

const glyph = (icon: IconSvgObject) => <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />;

// Factory (not a module const): each entry's icon is a real DOM node, so every
// component instance needs fresh nodes.
const createDefaultItems = (): AnimatedListEntry[] => [
  { icon: glyph(Folder01Icon), title: 'Brand assets', description: '24 files', meta: '2m' },
  { icon: glyph(Image01Icon), title: 'Launch hero.png', description: '2.4 MB', meta: '18m' },
  { icon: glyph(Video01Icon), title: 'Product tour.mp4', description: '148 MB', meta: '1h' },
  { icon: glyph(Note01Icon), title: 'Pricing notes', description: '1,240 words', meta: '3h' },
  { icon: glyph(CodeIcon), title: 'landing-page.tsx', description: '12 KB', meta: '5h' },
  { icon: glyph(FigmaIcon), title: 'Onboarding flow', description: '38 frames', meta: '8h' },
  { icon: glyph(MusicNote01Icon), title: 'Ambient loop.wav', description: '9.1 MB', meta: '1d' },
  { icon: glyph(Table01Icon), title: 'Q3 forecast', description: '4 sheets', meta: '1d' },
  { icon: glyph(Pdf01Icon), title: 'Brand guidelines.pdf', description: '6.8 MB', meta: '2d' },
  { icon: glyph(Presentation01Icon), title: 'Investor update', description: '22 slides', meta: '3d' },
  { icon: glyph(FileZipIcon), title: 'Icon set.zip', description: '1.2 MB', meta: '4d' },
  { icon: glyph(Image01Icon), title: 'Moodboard.jpg', description: '3.6 MB', meta: '5d' },
  { icon: glyph(File01Icon), title: 'Release notes', description: 'Version 2.4', meta: '1w' },
  { icon: glyph(Folder01Icon), title: 'Archive', description: '118 files', meta: '2w' },
  { icon: glyph(Video01Icon), title: 'Teaser cut.mov', description: '86 MB', meta: '3w' }
];

const HIDDEN: Record<Animation, Record<'above' | 'below', string>> = {
  pop: { above: 'translate3d(0, -12px, 0) scale(0.8)', below: 'translate3d(0, 12px, 0) scale(0.8)' },
  slide: { above: 'translate3d(0, -28px, 0) scale(0.98)', below: 'translate3d(0, 28px, 0) scale(0.98)' },
  fade: { above: 'translate3d(0, -4px, 0)', below: 'translate3d(0, 4px, 0)' }
};

const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const FADE_MASK = (() => {
  const steps = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
  const top = steps.map(t => `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) calc(var(--al-fade-top) * ${t})`);
  const bottom = [...steps]
    .reverse()
    .map(t => `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) calc(100% - var(--al-fade-bottom) * ${t})`);
  return `linear-gradient(to bottom, ${[...top, ...bottom].join(', ')})`;
})();

const size = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const ROOT_CLASS =
  'relative box-border w-[min(100%,var(--al-width))] min-w-0 max-w-full rounded-[calc(var(--al-radius)+12px)] text-[color:var(--al-ink)] [-webkit-tap-highlight-color:transparent] has-[>[role=listbox]:focus-visible]:outline-2 has-[>[role=listbox]:focus-visible]:outline-offset-[3px] has-[>[role=listbox]:focus-visible]:outline-[color:var(--al-accent)]';
const FRAMED_CLASS =
  'p-[6px] [background:var(--al-frame)] [box-shadow:var(--al-frame-shadow)] backdrop-blur-[20px] backdrop-saturate-[1.6]';
const FRAME_RIM_CLASS =
  'pointer-events-none absolute inset-0 z-[3] rounded-[inherit] [box-shadow:inset_0_0_0_1px_var(--al-frame-edge),inset_0_1px_0_var(--al-frame-highlight)]';
const VIEWPORT_CLASS =
  'relative box-border overflow-x-hidden overflow-y-auto overscroll-contain rounded-[calc(var(--al-radius)+6px)] p-[6px] outline-none [--al-fade-bottom:0px] [--al-fade-top:0px]';
const SCROLLBAR_CLASS =
  '[scrollbar-width:thin] [scrollbar-color:var(--al-thumb)_transparent] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-[color:var(--al-thumb)]';
const BARE_CLASS = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const ITEM_CLASS =
  'relative box-border flex min-w-0 cursor-pointer items-center gap-3 rounded-[var(--al-radius)] py-[10px] pr-[14px] pl-[10px] text-[color:var(--al-ink)] select-none [background:var(--al-tile)] [box-shadow:var(--al-tile-shadow)] [[data-animated]_&:not([data-state])]:opacity-0 hover:[filter:var(--al-hover)] active:[filter:var(--al-press)] data-[selected]:not-active:[filter:var(--al-active)]';
const LEAD_CLASS =
  'grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-[max(8px,calc(var(--al-radius)-4px))] bg-[color:var(--al-well)] text-[color:var(--al-ink)]';
const RIM_CLASS =
  'pointer-events-none absolute inset-0 rounded-[inherit] [box-shadow:inset_0_0_0_1px_var(--al-tile-edge),inset_0_1px_0_var(--al-tile-highlight)]';
const INDICATOR_CLASS =
  'pointer-events-none absolute top-0 right-0 left-0 z-[2] h-0 opacity-0 transition-opacity duration-200 ease-[ease]';
const RING_CLASS =
  'absolute inset-0 rounded-[var(--al-radius)] [background:var(--al-ring-fill)] [box-shadow:inset_0_0_0_1px_var(--al-ring)]';

const AnimatedList = (props: AnimatedListProps) => {
  let root!: HTMLDivElement;
  let viewportEl!: HTMLDivElement;
  let trackEl!: HTMLDivElement;
  let indicatorEl!: HTMLSpanElement;
  let ringEl!: HTMLSpanElement;
  const itemEls: (HTMLDivElement | null)[] = [];
  let engine: Engine | null = null;
  let keyboardNav = false;
  let navigating = false;

  const [selected, setSelected] = createSignal(props.initialSelectedIndex ?? -1);
  const baseId = createUniqueId();

  const items = createMemo(() => props.items ?? createDefaultItems());
  // Upstream stashed the latest props in settingsRef for the animation engine;
  // calling settings() gets the same always-current values.
  const settings = () => ({
    items: items(),
    onItemSelect: props.onItemSelect,
    selected: selected(),
    selectOnHover: props.selectOnHover ?? true,
    enableArrowNavigation: props.enableArrowNavigation ?? true,
    loop: props.loop ?? false,
    animation: props.animation ?? 'pop',
    animateOnce: props.animateOnce ?? false,
    stagger: props.stagger ?? 0.05,
    showGradients: props.showGradients ?? true,
    fadeSize: props.fadeSize ?? 56
  });

  onMount(() => {
    const rootEl = root;
    const vp = viewportEl;
    const track = trackEl;
    const indicator = indicatorEl;
    const ring = ringEl;
    if (!rootEl || !vp || !track || !indicator || !ring) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const springEase = CSS.supports?.('transition-timing-function', 'linear(0, 1)')
      ? SPRING
      : 'cubic-bezier(0.34, 1.4, 0.64, 1)';
    const transition = `transform 620ms ${springEase}, opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), filter 200ms ease`;
    const motion = { y: 0, h: 0, vy: 0, vh: 0, ty: 0, th: 0, ready: false };
    const fades = { top: '', bottom: '' };
    let boxes: (number[] | null)[] = [];
    let current: Animation | 'none' | null = null;
    let entered = false;
    let engaged = false;
    let pointer = [0, 0];
    let raf = 0;
    let last = 0;

    const mode = (): Animation | 'none' => {
      const chosen = settings().animation;
      if (chosen === 'none' || !HIDDEN[chosen]) return 'none';
      return reduced ? 'fade' : chosen;
    };

    const apply = (element: HTMLElement, state: State) => {
      element.dataset.state = state;
      const pose = current && current !== 'none' && state !== 'in' ? HIDDEN[current][state] : '';
      element.style.transform = pose;
      element.style.opacity = pose ? '0' : '';
    };

    const syncRing = () => {
      const item = itemEls[settings().selected];
      if (!item) return;
      const state = (item.dataset.state as State | undefined) || 'in';
      if (state === ring.dataset.state) return;
      ring.style.transitionDelay = item.style.transitionDelay;
      apply(ring, state);
    };

    const write = () => {
      indicator.style.transform = `translate3d(0, ${motion.y.toFixed(2)}px, 0)`;
      indicator.style.height = `${motion.h.toFixed(2)}px`;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const omega = 30;
      const zeta = 0.78;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        motion.vy += (omega * omega * (motion.ty - motion.y) - 2 * zeta * omega * motion.vy) * h;
        motion.vh += (omega * omega * (motion.th - motion.h) - 2 * zeta * omega * motion.vh) * h;
        motion.y += motion.vy * h;
        motion.h += motion.vh * h;
      }
      const moving =
        Math.abs(motion.ty - motion.y) > 0.05 ||
        Math.abs(motion.th - motion.h) > 0.05 ||
        Math.abs(motion.vy) + Math.abs(motion.vh) > 0.5;
      if (!moving) {
        motion.y = motion.ty;
        motion.h = motion.th;
        motion.vy = motion.vh = 0;
      }
      write();
      if (moving) raf = requestAnimationFrame(frame);
    };

    const place = (snap: boolean) => {
      const item = itemEls[settings().selected];
      if (!item) {
        indicator.style.opacity = '0';
        motion.ready = false;
        return;
      }
      indicator.style.opacity = '1';
      motion.ty = item.offsetTop;
      motion.th = item.offsetHeight;
      if (snap || reduced || !motion.ready) {
        motion.y = motion.ty;
        motion.h = motion.th;
        motion.vy = motion.vh = 0;
        motion.ready = true;
        write();
        return;
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const updateFades = () => {
      const s = settings();
      const span = Math.max(1, s.fadeSize);
      const { scrollTop, scrollHeight, clientHeight } = vp;
      const top = s.showGradients ? Math.min(span, Math.max(0, scrollTop)) : 0;
      const bottom = s.showGradients ? Math.min(span, Math.max(0, scrollHeight - clientHeight - scrollTop)) : 0;
      const nextTop = `${top.toFixed(1)}px`;
      const nextBottom = `${bottom.toFixed(1)}px`;
      if (nextTop !== fades.top) {
        fades.top = nextTop;
        vp.style.setProperty('--al-fade-top', nextTop);
      }
      if (nextBottom !== fades.bottom) {
        fades.bottom = nextBottom;
        vp.style.setProperty('--al-fade-bottom', nextBottom);
      }
    };

    const measure = () => {
      const offset = track.offsetTop;
      boxes = itemEls.map(item => (item ? [offset + item.offsetTop, item.offsetHeight] : null));
    };

    const reveal = (entrance: boolean) => {
      if (!entered) return;
      const s = settings();
      const top = vp.scrollTop;
      const view = vp.clientHeight;
      let order = 0;
      itemEls.forEach((item, index) => {
        const box = boxes[index];
        if (!item || !box) return;
        const start = box[0] - top;
        const overlap = Math.min(view, start + box[1]) - Math.max(0, start);
        const hidden =
          current !== 'none' && overlap < Math.min(box[1], view) * 0.5 && !(s.animateOnce && item.dataset.seen);
        const state = hidden ? (start + box[1] / 2 < view / 2 ? 'above' : 'below') : 'in';
        if (state === item.dataset.state) return;
        const delay = entrance && !hidden ? (order++ * Math.max(0, s.stagger)).toFixed(3) : 0;
        item.style.transitionDelay = delay ? `${delay}s, ${delay}s, 0s` : '';
        if (!hidden) item.dataset.seen = 'true';
        apply(item, state);
      });
      syncRing();
    };

    const sync = () => {
      const s = settings();
      itemEls.length = s.items.length;
      const els = itemEls.filter((item): item is HTMLDivElement => Boolean(item));
      const next = mode();
      const changed = next !== current;
      const restyle = changed ? els : els.filter(item => !item.dataset.state);
      current = next;
      if (current === 'none') entered = true;
      if (restyle.length) {
        const elements = changed ? [...restyle, ring] : restyle;
        for (const element of elements) element.style.transition = 'none';
        for (const item of restyle)
          apply(item, current === 'none' ? 'in' : (item.dataset.state as State | undefined) || 'below');
        if (changed) apply(ring, (itemEls[s.selected]?.dataset.state as State | undefined) || 'in');
        void rootEl.offsetHeight;
        for (const element of elements) element.style.transition = transition;
      }
      measure();
      reveal(restyle.length > 0);
    };

    sync();

    const gate =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries, observer) => {
              if (!entries.some(entry => entry.isIntersecting)) return;
              observer.disconnect();
              if (entered) return;
              entered = true;
              measure();
              reveal(true);
            },
            { rootMargin: '0px 0px -10% 0px' }
          );
    if (!entered) {
      if (gate) gate.observe(rootEl);
      else {
        entered = true;
        reveal(true);
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      place(true);
      updateFades();
      measure();
      reveal(false);
    });
    resizeObserver.observe(vp);
    resizeObserver.observe(track);

    const onScroll = () => {
      updateFades();
      reveal(false);
    };

    const onKey = (event: KeyboardEvent) => {
      const s = settings();
      if (!s.enableArrowNavigation || event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement;
      const focused = active === vp;
      const idle = !active || active === document.body || active === document.documentElement;
      if (!focused && !(engaged && idle)) return;
      const count = s.items.length;
      if (!count) return;
      const index = s.selected;
      let next: number | null = null;
      if (event.key === 'ArrowDown') next = index < 0 ? 0 : index + 1;
      else if (event.key === 'ArrowUp') next = index < 0 ? count - 1 : index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = count - 1;
      else if ((event.key === 'Enter' || (focused && event.key === ' ')) && index >= 0 && index < count) {
        event.preventDefault();
        s.onItemSelect?.(s.items[index], index);
        return;
      }
      if (next === null) return;
      event.preventDefault();
      next = s.loop ? (next + count) % count : Math.min(count - 1, Math.max(0, next));
      keyboardNav = true;
      navigating = true;
      setSelected(next);
    };

    const onPointerMove = (event: PointerEvent) => {
      const moved = event.clientX !== pointer[0] || event.clientY !== pointer[1];
      pointer = [event.clientX, event.clientY];
      if (!navigating || !moved) return;
      navigating = false;
      const item = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-index]') : null;
      if (item && rootEl.contains(item) && settings().selectOnHover) setSelected(Number(item.dataset.index));
    };

    const onEnter = () => {
      engaged = true;
    };
    const onLeave = () => {
      engaged = false;
    };

    vp.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    rootEl.addEventListener('pointerenter', onEnter);
    rootEl.addEventListener('pointerleave', onLeave);
    rootEl.addEventListener('pointermove', onPointerMove);

    updateFades();
    place(true);
    syncRing();

    engine = { place, syncRing, updateFades, sync };

    onCleanup(() => {
      cancelAnimationFrame(raf);
      gate?.disconnect();
      resizeObserver.disconnect();
      vp.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      rootEl.removeEventListener('pointerenter', onEnter);
      rootEl.removeEventListener('pointerleave', onLeave);
      rootEl.removeEventListener('pointermove', onPointerMove);
      engine = null;
    });
  });

  // Upstream deps: [items, animation]
  createEffect(() => {
    void props.items;
    void props.animation;
    untrack(() => engine?.sync());
  });

  // Upstream deps: [selected, fadeSize, showGradients]
  createEffect(() => {
    const index = selected();
    const fadeSize = props.fadeSize ?? 56;
    const showGradients = props.showGradients ?? true;
    const eng = engine;
    if (!eng) return;
    untrack(() => {
      eng.place(false);
      eng.syncRing();
      if (!keyboardNav) return;
      keyboardNav = false;
      const vp = viewportEl;
      const track = trackEl;
      const item = itemEls[index];
      if (!vp || !track || !item) return;
      const top = track.offsetTop + item.offsetTop;
      const bottom = top + item.offsetHeight;
      const room = Math.max(0, (vp.clientHeight - item.offsetHeight) / 2);
      const margin = Math.min(showGradients ? Math.max(12, fadeSize) : 12, room);
      if (top < vp.scrollTop + margin) {
        vp.scrollTo({ top: Math.max(0, top - margin), behavior: 'smooth' });
      } else if (bottom > vp.scrollTop + vp.clientHeight - margin) {
        vp.scrollTo({ top: bottom - vp.clientHeight + margin, behavior: 'smooth' });
      }
    });
  });

  // Upstream deps: [showGradients, fadeSize, maxHeight, gap]
  createEffect(() => {
    void props.showGradients;
    void props.fadeSize;
    void props.maxHeight;
    void props.gap;
    untrack(() => engine?.updateFades());
  });

  const hover = (index: number) => {
    if (!navigating) setSelected(index);
  };

  const choose = (item: AnimatedListItem, index: number) => {
    setSelected(index);
    props.onItemSelect?.(item, index);
  };

  return (
    <div
      ref={root}
      class={`${ROOT_CLASS} ${(props.frame ?? true) ? FRAMED_CLASS : ''} ${props.class ?? ''} ${props.className ?? ''}`
        .replace(/\s+/g, ' ')
        .trim()}
      data-animated={(props.animation ?? 'pop') !== 'none' ? '' : undefined}
      style={
        {
          ...(THEMES[props.theme ?? 'dark'] ?? THEMES.dark),
          '--al-radius': `${Math.max(0, props.radius ?? 14)}px`,
          '--al-gap': `${Math.max(0, props.gap ?? 8)}px`,
          '--al-width': size(props.width ?? 420),
          '--al-accent': props.accentColor || 'var(--al-ink)',
          ...(props.accentColor
            ? {
                '--al-ring': props.accentColor,
                '--al-ring-fill': `color-mix(in srgb, ${props.accentColor} 8%, transparent)`
              }
            : {}),
          ...props.style
        } as JSX.CSSProperties
      }
    >
      <div
        ref={viewportEl}
        class={`${VIEWPORT_CLASS} ${(props.displayScrollbar ?? true) ? SCROLLBAR_CLASS : BARE_CLASS}`}
        role="listbox"
        tabindex={0}
        aria-activedescendant={
          selected() >= 0 && selected() < items().length ? `${baseId}-${selected()}` : undefined
        }
        style={{
          'max-height': size(props.maxHeight ?? 440),
          'mask-image': (props.showGradients ?? true) ? FADE_MASK : undefined,
          '-webkit-mask-image': (props.showGradients ?? true) ? FADE_MASK : undefined
        }}
      >
        <div ref={trackEl} class="relative flex flex-col gap-[var(--al-gap)]">
          <For each={items()}>
            {(item, index) => {
              const entry = (): AnimatedListEntry =>
                item !== null && typeof item === 'object' ? item : { title: item };
              const isSelected = () => index() === selected();
              return (
                <div
                  ref={element => {
                    itemEls[index()] = element;
                  }}
                  id={`${baseId}-${index()}`}
                  class={`${ITEM_CLASS} ${props.itemClassName ?? ''}`.trim()}
                  role="option"
                  aria-selected={isSelected()}
                  data-index={index()}
                  data-selected={isSelected() ? '' : undefined}
                  onPointerEnter={(props.selectOnHover ?? true) ? () => hover(index()) : undefined}
                  onClick={() => choose(item, index())}
                >
                  {props.renderItem ? (
                    props.renderItem(item, index(), isSelected())
                  ) : (
                    <>
                      {(entry().image || entry().icon) && (
                        <span class={LEAD_CLASS}>
                          {entry().image ? (
                            <img
                              class="block h-full w-full object-cover"
                              src={entry().image}
                              alt=""
                              draggable={false}
                            />
                          ) : (
                            entry().icon
                          )}
                        </span>
                      )}
                      <span class="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <span class="overflow-hidden text-[14.5px] leading-[1.3] font-semibold tracking-[-0.01em] text-ellipsis whitespace-nowrap">
                          {entry().title}
                        </span>
                        {entry().description && (
                          <span class="overflow-hidden text-[13px] leading-[1.35] text-ellipsis whitespace-nowrap text-[color:var(--al-muted)]">
                            {entry().description}
                          </span>
                        )}
                      </span>
                      {entry().meta && (
                        <span class="flex-none text-[12.5px] tabular-nums text-[color:var(--al-muted)]">
                          {entry().meta}
                        </span>
                      )}
                    </>
                  )}
                  <span class={RIM_CLASS} aria-hidden="true" />
                </div>
              );
            }}
          </For>
          <span ref={indicatorEl} class={INDICATOR_CLASS} aria-hidden="true">
            <span ref={ringEl} class={RING_CLASS} />
          </span>
        </div>
      </div>
      {(props.frame ?? true) && <span class={FRAME_RIM_CLASS} aria-hidden="true" />}
    </div>
  );
};

export default AnimatedList;
