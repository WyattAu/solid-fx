import { createEffect, createSignal, For, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import HugeiconsIcon, { type IconSvgObject } from '@/lib/HugeiconsIcon';
import {
  CursorPointer01Icon,
  Download04Icon,
  Layers01Icon,
  Notification03Icon,
  PaintBoardIcon,
  Rocket01Icon,
  Settings02Icon,
  TextFontIcon
} from '@hugeicons/core-free-icons';

export interface BranchedMenuChild {
  value: string;
  label: string;
  icon?: JSX.Element | IconSvgObject;
}

export interface BranchedMenuItem {
  label: string;
  value?: string;
  children?: BranchedMenuChild[];
}

export interface BranchedMenuProps {
  items?: BranchedMenuItem[];
  defaultOpen?: number | number[];
  defaultActive?: string;
  onSelect?: (value: string, item: BranchedMenuChild | BranchedMenuItem) => void;
  onToggle?: (index: number, open: boolean) => void;
  color?: string;
  accentColor?: string;
  lineColor?: string;
  width?: number;
  rowHeight?: number;
  indent?: number;
  trunk?: number;
  radius?: number;
  lineWidth?: number;
  fontSize?: number;
  drawDuration?: number;
  foldDuration?: number;
  className?: string;
  class?: string;
}

const DEFAULT_ITEMS: BranchedMenuItem[] = [
  {
    label: 'Getting started',
    children: [
      { value: 'install', label: 'Installation', icon: Download04Icon },
      { value: 'quick', label: 'Quick start', icon: Rocket01Icon },
      { value: 'config', label: 'Configuration', icon: Settings02Icon },
      { value: 'theming', label: 'Theming', icon: PaintBoardIcon }
    ]
  },
  {
    label: 'Components',
    children: [
      { value: 'buttons', label: 'Buttons', icon: CursorPointer01Icon },
      { value: 'typography', label: 'Typography', icon: TextFontIcon },
      { value: 'overlays', label: 'Overlays', icon: Layers01Icon },
      { value: 'toasts', label: 'Toasts', icon: Notification03Icon }
    ]
  }
];
const PAD = 6;
const MARK = 16;

// In Solid a passed-in icon is either an already-rendered element (a DOM node)
// or raw icon data from @hugeicons/core-free-icons (an array of tuples).
const renderIcon = (icon: JSX.Element | IconSvgObject) =>
  icon instanceof Element ? icon : <HugeiconsIcon icon={icon as IconSvgObject} size={16} strokeWidth={1.8} />;
const toSet = (open: number | number[]) => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);

const BranchedMenu = (props: BranchedMenuProps) => {  const items = () => props.items ?? DEFAULT_ITEMS;
  const defaultOpen = () => props.defaultOpen ?? 0;
  const rowHeight = () => props.rowHeight ?? 36;
  const fontSize = () => props.fontSize ?? 14;
  const indent = () => props.indent ?? 40;
  const trunk = () => props.trunk ?? 14;
  const radius = () => props.radius ?? 10;
  const width = () => props.width ?? 240;
  const color = () => props.color ?? '#f5f5f5';
  const accentColor = () => props.accentColor ?? '#f5f5f5';
  const lineColor = () => props.lineColor ?? '#3f3f46';
  const lineWidth = () => props.lineWidth ?? 1.5;
  const drawDuration = () => props.drawDuration ?? 400;
  const foldDuration = () => props.foldDuration ?? 300;

  const initActive = () => {
    if (props.defaultActive) return props.defaultActive;
    const first = items().find((it, i) => it.children && toSet(defaultOpen()).has(i));
    return first?.children?.[0]?.value ?? '';
  };

  const [open, setOpen] = createSignal<Set<number>>(toSet(defaultOpen()));
  const [active, setActive] = createSignal(initActive());

  let navEl: HTMLElement | undefined;
  const heads: (HTMLButtonElement | null)[] = [];
  let markerEl: HTMLSpanElement | undefined;

  const activeSection = () => items().findIndex(it => it.children?.some(kid => kid.value === active()));
  const markerShown = () => activeSection() >= 0 && open().has(activeSection());

  // Upstream: useLayoutEffect on [activeSection, markerShown, items, fontSize,
  // rowHeight] — place the active marker, glide on selection, jump on layout.
  createEffect(() => {
    void items();
    void fontSize();
    void rowHeight();
    const section = activeSection();
    const shown = markerShown();
    const place = (glide: boolean) => {
      const m = markerEl;
      const el = heads[section];
      if (!m) return;
      const on = shown && el;
      if (!glide) m.style.transition = 'none';
      if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`;
      m.toggleAttribute('data-on', Boolean(on));
      if (!glide) {
        void m.offsetHeight;
        m.style.transition = '';
      }
    };
    place(true);
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      place(false);
    });
    if (navEl) ro.observe(navEl);
    onCleanup(() => ro.disconnect());
  });

  const select = (value: string, item: BranchedMenuChild | BranchedMenuItem) => {
    setActive(value);
    props.onSelect?.(value, item);
  };
  const toggle = (i: number) => {
    const next = new Set(open());
    const isOpen = !next.has(i);
    if (isOpen) next.add(i);
    else next.delete(i);
    setOpen(next);
    props.onToggle?.(i, isOpen);
  };

  const r = () => Math.min(radius(), rowHeight() / 2 - 2);
  const endX = () => indent() - 8;
  const rowY = (k: number) => PAD + k * rowHeight() + rowHeight() / 2;
  const branch = (k: number) =>
    `M ${trunk()} ${rowY(k) - r()} A ${r()} ${r()} 0 0 0 ${trunk() + r()} ${rowY(k)} H ${endX()}`;
  const reach = (k: number) =>
    `M ${trunk()} 0 V ${rowY(k) - r()} A ${r()} ${r()} 0 0 0 ${trunk() + r()} ${rowY(k)} H ${endX()}`;
  const length = (k: number) => rowY(k) - r() + (Math.PI * r()) / 2 + (endX() - trunk() - r());

  return (
    <nav
      ref={navEl}
      class={`relative flex w-fit max-w-[min(var(--bm-w),100%)] flex-col pl-3.5 leading-[1.2] [color:var(--bm-ink)] [font-family:inherit] [font-size:var(--bm-font)] before:absolute before:top-2 before:bottom-0 before:left-0 before:w-0.5 before:rounded-[1px] before:[background:linear-gradient(to_bottom,var(--bm-line)_0%,var(--bm-line)_55%,transparent_100%)] before:content-['']${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      style={{
        '--bm-w': `${width()}px`,
        '--bm-ink': color(),
        '--bm-accent': accentColor(),
        '--bm-line': lineColor(),
        '--bm-font': `${fontSize()}px`,
        '--bm-row': `${rowHeight()}px`,
        '--bm-indent': `${indent()}px`,
        '--bm-line-w': lineWidth(),
        '--bm-draw': `${drawDuration()}ms`,
        '--bm-muted': `color-mix(in srgb, ${color()} 55%, transparent)`,
        '--bm-fold': `${foldDuration()}ms`
      }}
    >
      <span
        ref={markerEl}
        class="absolute -top-px left-0 z-[1] h-4 w-0.5 rounded-[1px] opacity-0 [background:var(--bm-accent)] [transition:top_220ms_cubic-bezier(0.23,1,0.32,1),opacity_150ms_ease] data-[on]:opacity-100 motion-reduce:[transition:opacity_150ms_ease]"
        aria-hidden="true"
      />
      <For each={items()}>
        {(item, i) => {
          const kids = () => item.children;
          const isOpen = () => (kids() ? open().has(i()) : false);
          const leafValue = () => item.value ?? item.label;
          const leafActive = () => !kids() && leafValue() === active();
          const bodyH = () => (kids() ? PAD * 2 + kids()!.length * rowHeight() : 0);
          return (
            <div class="group/section flex flex-col" data-open={isOpen() ? '' : undefined}>
              <button
                ref={(el) => {
                  heads[i()] = el;
                }}
                type="button"
                class="m-0 block cursor-pointer border-0 bg-transparent py-[9px] text-left font-medium outline-none [color:var(--bm-muted)] [font-family:inherit] [font-size:calc(var(--bm-font)+1px)] [-webkit-tap-highlight-color:transparent] [transition:color_200ms_ease] group-data-[open]/section:[color:var(--bm-ink)] data-[active]:[color:var(--bm-ink)] hover:[color:var(--bm-ink)]"
                aria-expanded={kids() ? isOpen() : undefined}
                aria-current={leafActive() ? 'true' : undefined}
                data-active={leafActive() ? '' : undefined}
                onClick={() => (kids() ? toggle(i()) : select(leafValue(), item))}
              >
                {item.label}
              </button>
              <Show when={kids()}>
                <div class="grid [grid-template-rows:0fr] [transition:grid-template-rows_var(--bm-fold)_cubic-bezier(0.23,1,0.32,1)] group-data-[open]/section:[grid-template-rows:1fr] motion-reduce:transition-none">
                  <div class="min-h-0 overflow-hidden">
                    <div class="relative box-border py-1.5" style={{ height: `${bodyH()}px` }}>
                      <svg
                        class="pointer-events-none absolute top-0 left-0 overflow-visible opacity-0 [transition:opacity_200ms_ease] group-data-[open]/section:opacity-100 group-data-[open]/section:[transition:opacity_250ms_ease_100ms]"
                        width={indent()}
                        height={bodyH()}
                        aria-hidden="true"
                      >
                        <path
                          class="fill-none [stroke:var(--bm-line)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round]"
                          d={`M ${trunk()} 0 V ${rowY(kids()!.length - 1) - r()}`}
                        />
                        <For each={kids()}>
                          {(_, k) => (
                            <path
                              class="fill-none [stroke:var(--bm-line)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round]"
                              d={branch(k())}
                            />
                          )}
                        </For>
                        <For each={kids()}>
                          {(kid, k) => (
                            <path
                              class="fill-none [stroke:var(--bm-accent)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round] [transition:stroke-dashoffset_var(--bm-draw)_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                              d={reach(k())}
                              style={{
                                'stroke-dasharray': `${length(k())}`,
                                'stroke-dashoffset': `${kid.value === active() ? 0 : length(k())}`
                              }}
                            />
                          )}
                        </For>
                      </svg>
                      <For each={kids()}>
                        {(kid) => (
                          <button
                            type="button"
                            class="m-0 box-border flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent py-0 pr-0 text-left outline-none [height:var(--bm-row)] [padding-left:var(--bm-indent)] [color:var(--bm-muted)] [font-family:inherit] [-webkit-tap-highlight-color:transparent] [transition:color_200ms_ease] hover:[color:var(--bm-ink)] data-[active]:font-medium data-[active]:[color:var(--bm-accent)]"
                            aria-current={kid.value === active() ? 'true' : undefined}
                            data-active={kid.value === active() ? '' : undefined}
                            tabIndex={isOpen() ? 0 : -1}
                            onClick={() => select(kid.value, kid)}
                          >
                            <Show when={kid.icon}>
                              <span class="inline-flex flex-none" aria-hidden="true">
                                {renderIcon(kid.icon as JSX.Element | IconSvgObject)}
                              </span>
                            </Show>
                            <span class="whitespace-nowrap">{kid.label}</span>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          );
        }}
      </For>
    </nav>
  );
};

export default BranchedMenu;
