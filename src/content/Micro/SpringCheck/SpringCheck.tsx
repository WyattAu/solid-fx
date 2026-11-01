import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';
import { Tick02Icon } from '@hugeicons/core-free-icons';

export type StrikeSide = 'left' | 'center' | 'right' | 'none';

export interface SpringCheckProps {
  label?: JSX.Element;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: string;
  fillColor?: string;
  checkColor?: string;
  boxSize?: number;
  boxRadius?: number;
  fontSize?: number;
  bounce?: number;
  strikeLag?: number;
  doneOpacity?: number;
  strike?: StrikeSide;
  ariaLabel?: string;
  className?: string;
}

const VISUAL_DURATION = 0.2;
const RULE_END = 0.84;
const SWELL = 0.35;
const TICK_PATH = String(Tick02Icon[0][1].d);
const ORIGIN: Record<StrikeSide, string> = {
  left: 'left center',
  center: 'center',
  right: 'right center',
  none: 'left center'
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const zetaOf = (bounce: number) =>
  bounce <= 0 ? 1 : -Math.log(bounce) / Math.sqrt(Math.PI ** 2 + Math.log(bounce) ** 2);

const readings = (t: number, doneOpacity: number, strikeLag: number) => {
  const held = clamp01(t);
  return {
    fill: `scale(${Math.max(t, 0)})`,
    box: `scale(${1 + SWELL * Math.max(0, t - 1)})`,
    tick: 1 - held,
    word: 1 - (1 - doneOpacity) * held,
    rule: `scaleX(${clamp01((held - strikeLag) / (RULE_END - strikeLag))})`
  };
};

const SpringCheck = (props: SpringCheckProps) => {
  const isControlled = () => props.checked !== undefined;
  const [inner, setInner] = createSignal(props.defaultChecked ?? false);
  const on = () => (isControlled() ? (props.checked as boolean) : inner());
  const reduce = usePrefersReducedMotion();

  const t = motionValue(on() ? 1 : 0);
  let viaPointer = false;
  let instant = false;
  let rowEl!: HTMLButtonElement;
  let boxEl: HTMLSpanElement | null = null;
  let fillEl: HTMLSpanElement | null = null;
  let tickEl: SVGPathElement | null = null;
  let wordEl: HTMLSpanElement | null = null;
  let ruleEl: HTMLSpanElement | null = null;

  const write = (value: number) => {
    const r = readings(value, props.doneOpacity ?? 0.42, props.strikeLag ?? 0.12);
    if (fillEl) fillEl.style.transform = r.fill;
    if (boxEl) boxEl.style.transform = r.box;
    if (tickEl) tickEl.style.strokeDashoffset = String(r.tick);
    if (wordEl) wordEl.style.opacity = String(r.word);
    if (ruleEl) ruleEl.style.transform = r.rule;
  };

  onMount(() => {
    const off = t.on('change', write);
    onCleanup(off);
  });
  // Upstream: useLayoutEffect(() => write(t.get())) on every render — also
  // rewrites the visuals when doneOpacity/strikeLag change.
  createEffect(() => {
    props.doneOpacity;
    props.strikeLag;
    write(t.get());
  });

  createEffect(() => {
    // Upstream deps: [on, reduce, bounce, t]
    const onNow = on();
    const reduceNow = reduce();
    const bounce = props.bounce ?? 0.2;
    const target = onNow ? 1 : 0;
    if (reduceNow || instant) {
      instant = false;
      t.jump(target);
      return;
    }
    if (t.get() === target && t.getVelocity() === 0) return;
    const controls = animate(t, target, {
      type: 'spring',
      visualDuration: VISUAL_DURATION,
      bounce: 1 - zetaOf(bounce)
    });
    onCleanup(() => controls.stop());
  });

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || props.disabled) return;
    viaPointer = true;
    if (!reduce() && rowEl) rowEl.dataset.pressed = '';
  };
  const handlePointerUp = () => {
    if (rowEl) delete rowEl.dataset.pressed;
  };
  const handlePointerCancel = () => {
    viaPointer = false;
    handlePointerUp();
  };
  const toggle = () => {
    if (props.disabled) return;
    instant = !viaPointer;
    viaPointer = false;
    const next = !on();
    if (!isControlled()) setInner(next);
    props.onChange?.(next);
  };

  const r = readings(t.get(), props.doneOpacity ?? 0.42, props.strikeLag ?? 0.12);
  const boxSize = () => props.boxSize ?? 28;
  const fontSize = () => props.fontSize ?? 18;
  const strike = () => props.strike ?? 'left';
  const ring = () => (boxSize() >= 24 ? 2 : 1.5);
  const gap = () => Math.min(16, Math.max(8, Math.round(boxSize() * 0.43)));
  const ruleHeight = () => Math.max(1.5, Math.round(fontSize() / 6) / 2);

  return (
    <button
      ref={rowEl}
      type="button"
      role="checkbox"
      aria-checked={on()}
      aria-label={props.ariaLabel}
      disabled={props.disabled}
      class={`group relative inline-flex cursor-pointer touch-manipulation select-none items-center gap-[var(--sc-gap)] border-0 bg-transparent p-0 text-left font-medium leading-[1.2] tracking-[-0.01em] outline-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [color:var(--sc-ink)] text-[length:var(--sc-font)] min-h-[var(--sc-row)] disabled:cursor-not-allowed disabled:opacity-50${props.className ? ` ${props.className}` : ''}`}
      style={
        {
          '--sc-ink': props.color ?? '#ffffff',
          '--sc-fill': props.fillColor ?? '#ffffff',
          '--sc-check': props.checkColor ?? '#0b0b0f',
          '--sc-box': `${boxSize()}px`,
          '--sc-radius': `${props.boxRadius ?? 9}px`,
          '--sc-font': `${fontSize()}px`,
          '--sc-ring': `${ring()}px`,
          '--sc-gap': `${gap()}px`,
          '--sc-row': `${Math.max(44, boxSize() + 16)}px`,
          '--sc-rule': `${ruleHeight()}px`,
          '--sc-origin': ORIGIN[strike()] || ORIGIN.left,
          '--sc-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)'
        } as JSX.CSSProperties
      }
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onClick={toggle}
    >
      <span class="flex-none h-[var(--sc-box)] w-[var(--sc-box)] rounded-[var(--sc-radius)] [transition:transform_160ms_var(--sc-ease-out)] group-data-[pressed]:[transform:scale(0.95)] group-focus-visible:outline-offset-[3px] group-focus-visible:[outline:2px_solid_color-mix(in_srgb,var(--sc-ink)_45%,transparent)] motion-reduce:transition-none">
        <span
          ref={el => {
            boxEl = el;
          }}
          class="relative grid h-full w-full origin-center place-items-center overflow-hidden rounded-[inherit]"
          style={{ transform: r.box }}
        >
          <span
            class="absolute inset-0 rounded-[inherit] opacity-[0.28] [transition:opacity_120ms_ease] [box-shadow:inset_0_0_0_var(--sc-ring)_var(--sc-ink)] [@media(hover:hover)_and_(pointer:fine)]:group-enabled:group-hover:opacity-50"
            aria-hidden="true"
          />
          <span
            ref={el => {
              fillEl = el;
            }}
            class="absolute inset-0 origin-center rounded-[inherit] [background:var(--sc-fill)]"
            style={{ transform: r.fill }}
          />
          <svg
            class="relative h-[68%] w-[68%] overflow-visible fill-none [stroke:var(--sc-check)] [stroke-width:2.6] [stroke-linecap:round] [stroke-linejoin:round]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              ref={el => {
                tickEl = el;
              }}
              d={TICK_PATH}
              pathLength={1}
              strokeDasharray={1}
              style={{ 'stroke-dashoffset': r.tick }}
            />
          </svg>
        </span>
      </span>
      <span class="relative inline-block">
        <span
          ref={el => {
            wordEl = el;
          }}
          class="inline-block"
          style={{ opacity: r.word }}
        >
          {props.label ?? 'Ship the build'}
        </span>
        {strike() !== 'none' ? (
          <span
            ref={el => {
              ruleEl = el;
            }}
            class="pointer-events-none absolute inset-x-0 top-[46%] h-[var(--sc-rule)] rounded-[2px] bg-current [transform-origin:var(--sc-origin)]"
            aria-hidden="true"
            style={{ transform: r.rule }}
          />
        ) : null}
      </span>
    </button>
  );
};

export default SpringCheck;
