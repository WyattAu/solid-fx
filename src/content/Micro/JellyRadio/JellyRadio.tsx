import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import type { MotionValue } from 'motion';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

export type JellyRadioItem = string | { value: string; label: JSX.Element; icon?: JSX.Element; disabled?: boolean };

export interface JellyRadioProps {
  items?: JellyRadioItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  chipColor?: string;
  activeColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: 'sm' | 'md' | 'lg';
  gap?: number;
  radius?: number;
  swell?: number;
  barge?: number;
  shrink?: number;
  jelly?: number;
  bounce?: number;
  stagger?: number;
  stiffness?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  class?: string;
}

interface ChipValues {
  x: MotionValue<number>;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}

const DEFAULT_ITEMS: JellyRadioItem[] = ['Off', 'Low', 'Medium', 'High', 'Max'];
const SIZES: Record<string, [number, number, number]> = { sm: [28, 12, 12], md: [36, 13, 16], lg: [44, 14, 20] };

const spring = (k: number, m: number, bounce: number) => ({
  type: 'spring' as const,
  stiffness: k,
  damping: 2 * Math.sqrt(k * m) * (1 - bounce),
  mass: m
});

const JellyRadio = (props: JellyRadioProps) => {
  const list = createMemo(() =>
    (props.items ?? DEFAULT_ITEMS).map(it => (typeof it === 'string' ? { value: it, label: it } : it))
  );
  const [inner, setInner] = createSignal(
    props.defaultValue ?? (props.items ?? DEFAULT_ITEMS).map(it => (typeof it === 'string' ? { value: it, label: it } : it))[0]?.value
  );
  const current = () => props.value ?? inner();
  const at = createMemo(() => Math.max(0, list().findIndex(it => it.value === current())));
  const reduce = usePrefersReducedMotion();
  let groupEl: HTMLDivElement | undefined;
  let chipEls: (HTMLButtonElement | null)[] = [];
  let widths: number[] = [];
  const mvs: ChipValues[] = [];
  let applied = at();
  const dims = () => SIZES[props.size ?? 'md'] ?? SIZES.md;

  const mvFor = (i: number): ChipValues => {
    let mv = mvs[i];
    if (!mv) {
      mv = { x: motionValue(0), sx: motionValue(1), sy: motionValue(1) };
      mvs[i] = mv;
    }
    return mv;
  };

  const apply = (sel: number, instant: boolean) => {
    const count = list().length;
    const swell = props.swell ?? 0.2;
    const barge = props.barge ?? 6;
    const shrink = props.shrink ?? 0.05;
    const jelly = props.jelly ?? 1;
    const bounce = props.bounce ?? 0.25;
    const stagger = props.stagger ?? 22;
    const stiffness = props.stiffness ?? 580;
    const reduced = reduce();
    const rtl = groupEl ? getComputedStyle(groupEl).direction === 'rtl' : false;
    const push = ((widths[sel] ?? 0) * swell) / 2 + barge;
    for (let i = 0; i < count; i++) {
      const mv = mvFor(i);
      const on = i === sel;
      const far = Math.abs(i - sel);
      const dir = Math.sign(i - sel) * (rtl ? -1 : 1);
      const x = dir * push;
      const s = on ? 1 + swell : 1 - shrink;
      if (instant || reduced) {
        mv.x.jump(x);
        mv.sx.jump(s);
        mv.sy.jump(s);
        continue;
      }
      const k = stiffness * (1 - 0.12 * Math.min(far, 3));
      const inFlight = mv.x.isAnimating() || mv.sx.isAnimating() || mv.sy.isAnimating();
      const delay = inFlight ? 0 : (far * stagger) / 1000;
      animate(mv.x, x, { ...spring(k, 0.9, bounce), delay });
      animate(mv.sx, s, {
        ...spring(k * (1 + 0.24 * jelly), 0.9 - 0.1 * jelly, Math.min(0.85, bounce + 0.3 * jelly)),
        delay
      });
      animate(mv.sy, s, { ...spring(k * (1 - 0.14 * jelly), 0.9 + 0.05 * jelly, bounce), delay: delay + 0.05 * jelly });
    }
  };

  const measure = () => {
    const group = groupEl;
    if (!group) return;
    widths = chipEls.map(el => el?.offsetWidth ?? 0);
    const chipH = chipEls[0]?.offsetHeight ?? 0;
    const maxW = Math.max(0, ...widths);
    const swell = props.swell ?? 0.2;
    const barge = props.barge ?? 6;
    group.style.setProperty('--jr-pad-x', `${Math.ceil((maxW * swell * 1.3) / 2 + barge) + 2}px`);
    group.style.setProperty('--jr-pad-y', `${Math.ceil((chipH * swell) / 2) + 2}px`);
  };

  // Upstream: layout effect on [itemsKey, size, gap, swell, barge, shrink].
  createEffect(() => {
    void list()
      .map(it => it.value)
      .join('|');
    void props.size;
    void props.gap;
    void props.swell;
    void props.barge;
    void props.shrink;
    const settle = () => {
      measure();
      apply(untrack(() => applied), true);
    };
    settle();
    const observer = new ResizeObserver(settle);
    if (groupEl) observer.observe(groupEl);
    document.fonts?.ready.then(settle);
    onCleanup(() => observer.disconnect());
  });

  // Upstream: effect on [at] — instant re-layout when the selection changes.
  createEffect(() => {
    const now = at();
    if (applied === now) return;
    applied = now;
    apply(now, true);
  });

  onMount(() => {
    onCleanup(() =>
      mvs.forEach(mv => {
        mv.x.stop();
        mv.sx.stop();
        mv.sy.stop();
        mv.x.destroy();
        mv.sx.destroy();
        mv.sy.destroy();
      })
    );
  });

  const commit = (i: number, instant: boolean) => {
    const items = list();
    if (props.disabled || i === at() || !items[i] || items[i].disabled) return;
    applied = i;
    apply(i, instant);
    if (props.value === undefined) setInner(items[i].value);
    untrack(() => props.onChange?.(items[i].value, i));
  };
  const stepFrom = (i: number, dir: number) => {
    const n = list().length;
    let j = i;
    for (let tries = 0; tries < n; tries++) {
      j = (j + dir + n) % n;
      if (!list()[j].disabled) return j;
    }
    return i;
  };
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = stepFrom(i, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = stepFrom(i, -1);
    else if (e.key === 'Home') next = stepFrom(-1, 1);
    else if (e.key === 'End') next = stepFrom(list().length, -1);
    else if (e.key === ' ' || e.key === 'Enter') next = i;
    if (next === null) return;
    e.preventDefault();
    commit(next, true);
    chipEls[next]?.focus();
  };

  return (
    <div
      ref={groupEl}
      role="radiogroup"
      aria-label={props.ariaLabel ?? 'Options'}
      data-disabled={props.disabled ? '' : undefined}
      class={`group inline-flex items-center select-none [-webkit-touch-callout:none] gap-[var(--jr-gap)] px-[var(--jr-pad-x)] py-[var(--jr-pad-y)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      style={{
        '--jr-chip': props.chipColor ?? '#27272a',
        '--jr-active': props.activeColor ?? '#f5f5f5',
        '--jr-text': props.textColor ?? '#f5f5f5',
        '--jr-active-text': props.activeTextColor ?? '#18181b',
        '--jr-gap': `${props.gap ?? 8}px`,
        '--jr-radius': `${props.radius ?? 18}px`,
        '--jr-h': `${dims()[0]}px`,
        '--jr-font': `${dims()[1]}px`,
        '--jr-px': `${dims()[2]}px`
      }}
    >
      <For each={list()}>
        {(it, i) => {
          const mv = mvFor(i());
          const attach = (el: HTMLButtonElement) => {
            chipEls[i()] = el;
            // The upstream Chip is a motion.button whose transform derives from
            // three motion values; subscribe and write the transform directly.
            const write = () => {
              el.style.transform = `translateX(${mv.x.get()}px) scale(${mv.sx.get()}, ${mv.sy.get()})`;
            };
            write();
            const offs = [mv.x.on('change', write), mv.sx.on('change', write), mv.sy.on('change', write)];
            onCleanup(() => offs.forEach(off => off()));
          };
          return (
            <button
              ref={attach}
              type="button"
              role="radio"
              aria-checked={i() === at()}
              tabIndex={i() === at() ? 0 : -1}
              disabled={props.disabled || !!it.disabled}
              class="group/chip relative m-0 cursor-pointer touch-manipulation border-0 bg-transparent p-0 text-inherit outline-none [font:inherit] origin-center [-webkit-tap-highlight-color:transparent] data-[on=true]:cursor-default disabled:cursor-default disabled:opacity-40 group-data-[disabled]:disabled:opacity-100"
              data-on={i() === at() ? 'true' : 'false'}
              onClick={(e: MouseEvent) => commit(i(), e.detail === 0)}
              onKeyDown={(e: KeyboardEvent) => onKeyDown(e, i())}
            >
              <span class="relative inline-flex items-center justify-center gap-[0.4em] overflow-hidden rounded-[var(--jr-radius)] bg-[var(--jr-chip)] leading-none font-medium whitespace-nowrap [color:var(--jr-text)] [height:var(--jr-h)] [padding:0_var(--jr-px)] [font-size:var(--jr-font)] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1),background-color_200ms_ease,color_200ms_ease] group-active/chip:scale-[0.97] motion-reduce:group-active/chip:scale-100 group-data-[on=true]/chip:bg-[var(--jr-active)] group-data-[on=true]/chip:[color:var(--jr-active-text)] before:pointer-events-none before:absolute before:inset-0 before:bg-[var(--jr-text)] before:opacity-0 before:[transition:opacity_160ms_ease] before:content-[''] [@media(hover:hover)_and_(pointer:fine)]:group-hover/chip:group-enabled/chip:group-data-[on=false]/chip:before:opacity-[0.11]">
                {it.icon ? <span class="inline-flex">{it.icon}</span> : null}
                <span class="jelly-radio__label">{it.label}</span>
              </span>
            </button>
          );
        }}
      </For>
    </div>
  );
};

export default JellyRadio;
