import { createEffect, createSignal, For, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { FavouriteIcon, StarIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons';
import type { IconSvgObject } from '@/lib/HugeiconsIcon';

export type PulseHeartIcon = 'heart' | 'star' | 'thumb';

export interface PulseHeartProps {
  liked?: boolean;
  defaultLiked?: boolean;
  count?: number;
  onChange?: (liked: boolean, count: number) => void;
  showCount?: boolean;
  icon?: PulseHeartIcon | JSX.Element;
  idleOutline?: boolean;
  size?: number;
  corner?: number;
  likedColor?: string;
  idleColor?: string;
  pillColor?: string;
  textColor?: string;
  duration?: number;
  dotSize?: number;
  overshoot?: number;
  beat?: number;
  rollDuration?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
  class?: string;
}

type Roll = { a: string; b: string; at: number; up: boolean };
type Cell = { ch: string } | { top: string; bottom: string };

const OUT = 0.4;
const ICONS: Record<PulseHeartIcon, IconSvgObject> = { heart: FavouriteIcon, star: StarIcon, thumb: ThumbsUpIcon };

const back = (k: number, c: number) => {
  const u = k - 1;
  return 1 + (c + 1) * u ** 3 + c * u ** 2;
};
const swellOf = (t: number, c: number) =>
  t <= 0 ? 0 : t < OUT ? 1 - (1 - t / OUT) ** 3 : 1 - back((t - OUT) / (1 - OUT), c);
const format = (n: number) => new Intl.NumberFormat().format(n);
const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const PulseHeart = (props: PulseHeartProps) => {
  const controlled = () => props.liked !== undefined;
  const [inner, setInner] = createSignal(props.defaultLiked ?? false);
  const [total, setTotal] = createSignal(props.count ?? 0);
  const liked = () => (controlled() ? (props.liked as boolean) : inner());
  const [shown, setShown] = createSignal({ liked: liked(), count: props.count ?? 0 });
  const [roll, setRoll] = createSignal<Roll | null>(null);

  let rootEl!: HTMLButtonElement;
  let pillEl!: HTMLSpanElement;
  let heartEl!: HTMLSpanElement;
  let glyphEl: SVGGElement | undefined;
  let rollEl: HTMLSpanElement | undefined;
  let raf = 0;
  let rollTimer: ReturnType<typeof setTimeout> | undefined;
  let viaPointer = false;
  let shownRef = { liked: liked(), count: props.count ?? 0 };

  createEffect(() => {
    setTotal(props.count ?? 0);
  });

  createEffect(() => {
    const l = liked();
    const t = total();
    if (raf) return;
    if (shownRef.liked === l && shownRef.count === t) return;
    shownRef = { liked: l, count: t };
    setShown(shownRef);
  });

  // Upstream layout effect: flush the [data-instant] transition skip after paint.
  createEffect(() => {
    void shown();
    const root = rootEl;
    if (!root || root.dataset.instant === undefined) return;
    root.getBoundingClientRect();
    delete root.dataset.instant;
  });

  // Upstream layout effect on [roll]: start the digit roll from its pre-position.
  createEffect(() => {
    const r = roll();
    void shown();
    const el = rollEl;
    if (!el || !r) return;
    el.style.transition = 'none';
    el.style.transform = `translateY(${r.up ? '0' : '-1em'})`;
    el.getBoundingClientRect();
    el.style.transition = '';
    el.style.transform = `translateY(${r.up ? '-1em' : '0'})`;
  });

  onMount(() => {
    onCleanup(() => {
      cancelAnimationFrame(raf);
      clearTimeout(rollTimer);
    });
  });

  const startRoll = (from: number, to: number) => {
    if (from === to) return;
    const a = format(from);
    const b = format(to);
    const changed = a.length === b.length ? [...b].flatMap((ch, i) => (ch !== a[i] ? [i] : [])) : [];
    setRoll({ a, b, at: changed.length === 1 ? changed[0] : -1, up: to > from });
    clearTimeout(rollTimer);
    rollTimer = setTimeout(() => setRoll(null), props.rollDuration ?? 350);
  };

  const run = (nextLiked: boolean, nextCount: number) => {
    const root = rootEl;
    const heart = heartEl;
    const pill = pillEl;
    if (!root || !heart || !pill) return;
    const glyph = glyphEl;
    root.dataset.running = '';
    let swapped = false;
    let prev = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const D = props.duration ?? 560;
      const dot = props.dotSize ?? 0.3;
      const c = props.overshoot ?? 1.7;
      const B = props.beat ?? 3;
      const t = Math.min(1, (now - t0) / D);
      const step = prev ? now - prev : 1000 / 60;
      prev = now;
      const s = swellOf(t, c);
      const k = 1 - (1 - dot) * s;
      if (glyph) glyph.setAttribute('transform', `translate(12 12) scale(${k}) translate(-12 -12)`);
      else heart.style.transform = `scale(${k})`;
      pill.style.transform = `scale(${1 - (B / 100) * s})`;
      if (!swapped && t + step / 2 / D >= OUT) {
        swapped = true;
        root.dataset.liked = String(nextLiked);
        startRoll(shownRef.count, nextCount);
        shownRef = { liked: nextLiked, count: nextCount };
        setShown(shownRef);
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      raf = 0;
      if (glyph) glyph.removeAttribute('transform');
      heart.style.transform = '';
      pill.style.transform = '';
      delete root.dataset.running;
      const l = { liked: liked(), count: total() };
      if (l.liked !== shownRef.liked || l.count !== shownRef.count) {
        shownRef = l;
        setShown(shownRef);
      }
    };
    raf = requestAnimationFrame(tick);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || props.disabled) return;
    viaPointer = true;
    if (!reducedMotion() && rootEl) rootEl.dataset.pressed = '';
  };
  const handlePointerUp = () => {
    if (rootEl) delete rootEl.dataset.pressed;
  };
  const handlePointerCancel = () => {
    viaPointer = false;
    handlePointerUp();
  };
  const handleKeyDown = () => {
    viaPointer = false;
  };
  const handleClick = (e: MouseEvent) => {
    if (props.disabled || raf) return;
    const pointer = viaPointer && e.detail !== 0;
    viaPointer = false;
    const nextLiked = !liked();
    const nextCount = total() + (nextLiked ? 1 : -1);
    if (!controlled()) setInner(nextLiked);
    setTotal(nextCount);
    untrack(() => props.onChange?.(nextLiked, nextCount));
    if (pointer && !reducedMotion()) run(nextLiked, nextCount);
    else if (rootEl) rootEl.dataset.instant = '';
  };

  const iconVal = (): PulseHeartIcon | JSX.Element | undefined => props.icon ?? 'heart';
  const paths = (): IconSvgObject | null =>
    typeof iconVal() === 'string' ? (ICONS[iconVal() as PulseHeartIcon] ?? ICONS.heart) : null;

  const text = () => format(shown().count);
  const cells = (): Cell[] => {
    const r = roll();
    if (r) {
      if (r.at === -1) return [{ top: r.up ? r.a : r.b, bottom: r.up ? r.b : r.a }];
      return [...r.b].map((ch, i) =>
        i === r.at ? { top: r.up ? r.a[i] : ch, bottom: r.up ? ch : r.a[i] } : { ch }
      );
    }
    return [...text()].map(ch => ({ ch }));
  };

  return (
    <button
      ref={rootEl}
      type="button"
      aria-pressed={liked()}
      disabled={props.disabled}
      data-liked={String(shown().liked)}
      data-solid={props.idleOutline ? undefined : ''}
      data-no-count={(props.showCount ?? true) ? undefined : ''}
      class={`group relative m-0 inline-flex cursor-pointer touch-manipulation select-none items-center justify-center border-0 bg-transparent p-0 outline-none [font-family:inherit] [color:var(--ph-text)] rounded-[var(--ph-corner)] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [transition:transform_160ms_var(--ph-ease-out)] data-[pressed]:[transform:scale(0.97)] focus-visible:outline-offset-[3px] focus-visible:[outline:2px_solid_color-mix(in_srgb,var(--ph-liked)_60%,transparent)] disabled:cursor-default disabled:opacity-[0.55] motion-reduce:transition-none [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      style={{
        '--ph-size': `${props.size ?? 40}px`,
        '--ph-corner': `${props.corner ?? 32}px`,
        '--ph-pill': props.pillColor ?? '#232326',
        '--ph-idle': props.idleColor ?? '#8b8b93',
        '--ph-liked': props.likedColor ?? '#ff4d6d',
        '--ph-text': props.textColor ?? '#f5f5f5',
        '--ph-roll': `${props.rollDuration ?? 350}ms`,
        '--ph-stroke': `${(1.5 * (props.size ?? 40)) / 24}px`,
        '--ph-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)'
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      <span
        ref={pillEl}
        class="inline-flex origin-center items-center [gap:calc(var(--ph-size)*0.25)] [padding:calc(var(--ph-size)*0.3)] [padding-inline-end:calc(var(--ph-size)*0.4)] group-data-[no-count]:[padding-inline-end:calc(var(--ph-size)*0.3)] rounded-[var(--ph-corner)] [background:var(--ph-pill)] [@media(prefers-contrast:more)]:[box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--ph-text)_25%,transparent)]"
      >
        <span
          ref={heartEl}
          class="block h-[var(--ph-size)] w-[var(--ph-size)] origin-center [color:var(--ph-idle)] [transition:color_160ms_ease] group-data-[liked=true]:[color:var(--ph-liked)] group-data-[running]:transition-none group-data-[instant]:transition-none motion-reduce:[transition:color_200ms_ease] [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:overflow-visible [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-width:var(--ph-stroke)] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] group-data-[liked=true]:[&_svg]:fill-current group-data-[solid]:[&_svg]:fill-current [@media(hover:hover)_and_(pointer:fine)]:group-enabled:group-hover:group-data-[liked=false]:[color:color-mix(in_srgb,var(--ph-idle)_45%,var(--ph-liked))]"
          aria-hidden="true"
        >
          {paths() ? (
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <g
                ref={el => {
                  glyphEl = el;
                }}
              >
                <For each={paths()!}>
                  {([, attrs]) => <path d={String(attrs.d)} vector-effect="non-scaling-stroke" />}
                </For>
              </g>
            </svg>
          ) : (
            iconVal()
          )}
        </span>
        {props.showCount ?? true ? (
          <span
            class="inline-flex font-semibold leading-none tracking-[-0.1px] tabular-nums [font-size:calc(var(--ph-size)*0.5)] [color:var(--ph-text)] [&>span]:block [&>span]:h-[1em]"
            aria-hidden="true"
          >
            <For each={cells()}>
              {(cell, i) =>
                'ch' in cell ? (
                  <span>{cell.ch}</span>
                ) : (
                  <span class="relative overflow-hidden">
                    <span
                      ref={el => {
                        rollEl = el;
                      }}
                      class="flex flex-col [transition:transform_var(--ph-roll)_var(--ph-ease-out)] motion-reduce:transition-none [&>span]:block [&>span]:h-[1em] [&>span]:leading-none"
                    >
                      <span>{cell.top}</span>
                      <span>{cell.bottom}</span>
                    </span>
                  </span>
                )
              }
            </For>
          </span>
        ) : null}
        <span class="sr-only">
          {(props.showCount ?? true) ? `${props.label ?? 'Like'}, ${format(total())}` : (props.label ?? 'Like')}
        </span>
      </span>
    </button>
  );
};

export default PulseHeart;
