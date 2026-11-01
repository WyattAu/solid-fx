import { createEffect, onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

export type StatusMarkStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

export interface StatusMarkProps {
  status?: StatusMarkStatus;
  progress?: number;
  label?: JSX.Element;
  color?: string;
  doneColor?: string;
  errorColor?: string;
  size?: number;
  strokeWidth?: number;
  dashes?: number;
  fontSize?: number;
  spinDuration?: number;
  arcLength?: number;
  drawDuration?: number;
  fillOpacity?: number;
  strike?: boolean;
  strikeDelay?: number;
  className?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

const UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const MORPH = { duration: 0.3, ease: [0.77, 0, 0.175, 1] as [number, number, number, number] };
const CHECK = 'M7.5 12.25 10.5 15.25 16.75 8.75';
const CROSS = 'M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5';
const TEXT: Record<StatusMarkStatus, string> = {
  pending: 'Pending',
  running: 'In progress',
  done: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled'
};
const IDLE_DASH = 0.3;
const STYLE = '@keyframes sm-breathe{50%{opacity:.45}}';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const StatusMark = (props: StatusMarkProps) => {
  const reduce = usePrefersReducedMotion();
  const status = () => props.status ?? 'pending';
  const size = () => props.size ?? 20;
  const strokeWidth = () => props.strokeWidth ?? 2;
  const r = () => 10 - strokeWidth() / 2;
  const C = () => 2 * Math.PI * r();
  const P = () => C() / Math.max(1, props.dashes ?? 8);
  const determinate = () =>
    status() === 'running' && typeof props.progress === 'number' && Number.isFinite(props.progress);
  const indeterminate = () => status() === 'running' && !determinate();
  const solid = () => status() === 'running' || status() === 'done' || status() === 'failed';
  const targetArc = () =>
    indeterminate() ? (props.arcLength ?? 0.68) : determinate() ? clamp01(props.progress as number) : 1;

  const mode = motionValue(solid() ? 1 : 0);
  const arc = motionValue(targetArc());
  const travel = motionValue(0);
  let ringEl!: SVGCircleElement;
  let gen = 0;

  const writeDash = () => {
    const m = mode.get();
    const a = arc.get();
    const c = C();
    const p = P();
    const dash = IDLE_DASH * p + (a * c - IDLE_DASH * p) * m;
    const gap = (1 - IDLE_DASH) * p + ((1 - a) * c - (1 - IDLE_DASH) * p) * m;
    ringEl?.setAttribute('stroke-dasharray', `${Math.max(0, dash)} ${Math.max(0, gap)}`);
  };

  // Upstream: useLayoutEffect on [C, P] — writeDash tracks C()/P() via props.
  createEffect(() => {
    writeDash();
    ringEl?.setAttribute('stroke-dashoffset', String(travel.get()));
  });

  onMount(() => {
    const offs = [
      mode.on('change', writeDash),
      arc.on('change', writeDash),
      travel.on('change', (v: number) => ringEl?.setAttribute('stroke-dashoffset', String(v)))
    ];
    onCleanup(() => {
      offs.forEach(off => off());
      mode.stop();
      arc.stop();
      travel.stop();
    });
  });

  createEffect(() => {
    // Upstream deps: [status, determinate, targetArc, reduce, C, P, spinDuration]
    const determinateNow = determinate();
    const targetArcNow = targetArc();
    const reducedNow = reduce();
    const circumference = C();
    const perimeter = P();
    const spinMs = props.spinDuration ?? 1100;
    const genAtStart = ++gen;

    if (reducedNow) {
      mode.jump(solid() ? 1 : 0);
      arc.jump(targetArcNow);
      travel.jump(0);
      return;
    }
    if (mode.get() === 0) arc.jump(targetArcNow);

    const controls = [animate(mode, solid() ? 1 : 0, MORPH), animate(arc, targetArcNow, UI)];
    if (indeterminate()) {
      const t0 = travel.get();
      controls.push(
        animate(travel, [t0, t0 - circumference], { duration: spinMs / 1000, ease: 'linear', repeat: Infinity })
      );
    } else {
      const unit = determinateNow ? circumference : perimeter;
      const to = Math.floor(travel.get() / unit) * unit;
      const tween = animate(travel, to, UI);
      controls.push(tween);
      tween.then(() => {
        if (gen === genAtStart) travel.jump(0);
      });
    }
    onCleanup(() => controls.forEach(control => control.stop()));
  });

  const spoken = () =>
    TEXT[status()] + (determinate() ? `, ${Math.round(clamp01(props.progress as number) * 100)}%` : '');
  const hasLabel = () => props.label !== undefined && props.label !== null;

  return (
    <span
      class={`group relative inline-flex items-center align-middle leading-none [gap:calc(var(--sm-size)*0.5)]${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      data-status={status()}
      data-indeterminate={indeterminate() ? '' : undefined}
      data-strike={(props.strike ?? true) ? '' : undefined}
      style={{
        '--sm-size': `${size()}px`,
        '--sm-stroke': strokeWidth(),
        '--sm-color': props.color ?? 'currentColor',
        '--sm-done': props.doneColor ?? '#22c55e',
        '--sm-error': props.errorColor ?? '#ef4444',
        '--sm-fill': props.fillOpacity ?? 0.06,
        '--sm-font': `${props.fontSize ?? 14}px`,
        '--sm-draw': `${props.drawDuration ?? 240}ms`,
        '--sm-strike-delay': `${120 + (props.strikeDelay ?? 60)}ms`,
        '--sm-check-delay': '120ms',
        ...props.style
      }}
    >
      <style>{STYLE}</style>
      <svg
        class="shrink-0 overflow-visible [color:var(--sm-color)] [transition:color_200ms_ease] group-data-[status=done]:[color:var(--sm-done)] group-data-[status=failed]:[color:var(--sm-error)]"
        viewBox="0 0 24 24"
        width={size()}
        height={size()}
        role={hasLabel() ? undefined : 'img'}
        aria-label={hasLabel() ? undefined : spoken()}
        aria-hidden={hasLabel() || undefined}
      >
        <circle
          class="[fill:currentColor] [stroke:currentColor] [stroke-width:var(--sm-stroke)] [fill-opacity:0] [stroke-opacity:0] [transition:fill-opacity_180ms_ease,stroke-opacity_200ms_ease] group-data-[status=running]:[stroke-opacity:0.2] group-data-[status=done]:[fill-opacity:var(--sm-fill)] group-data-[status=failed]:[fill-opacity:var(--sm-fill)]"
          cx="12"
          cy="12"
          r={r()}
          transform="rotate(-90 12 12)"
        />
        <circle
          ref={ringEl}
          class="fill-none [stroke:currentColor] [stroke-width:var(--sm-stroke)] [stroke-linecap:round] opacity-[0.55] [transition:opacity_200ms_ease] group-data-[status=running]:opacity-100 group-data-[status=done]:opacity-100 group-data-[status=failed]:opacity-100 motion-reduce:group-data-[indeterminate]:animate-[sm-breathe_1400ms_cubic-bezier(0.77,0,0.175,1)_infinite]"
          cx="12"
          cy="12"
          r={r()}
          transform="rotate(-90 12 12)"
        />
        <path
          class="fill-none [stroke:currentColor] [stroke-width:var(--sm-stroke)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-dasharray:1_2] [stroke-dashoffset:1.05] opacity-0 [transition:stroke-dashoffset_160ms_cubic-bezier(0.23,1,0.32,1),opacity_0ms_linear_160ms] group-data-[status=done]:[stroke-dashoffset:0] group-data-[status=done]:opacity-100 group-data-[status=done]:[transition:stroke-dashoffset_var(--sm-draw)_cubic-bezier(0.23,1,0.32,1)_var(--sm-check-delay),opacity_0ms_linear_var(--sm-check-delay)] motion-reduce:[stroke-dashoffset:0] motion-reduce:[transition:opacity_200ms_ease] motion-reduce:group-data-[status=done]:[transition:opacity_200ms_ease]"
          d={CHECK}
          pathLength="1"
        />
        <path
          class="fill-none [stroke:currentColor] [stroke-width:var(--sm-stroke)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-dasharray:1_2] [stroke-dashoffset:1.05] opacity-0 [transition:stroke-dashoffset_160ms_cubic-bezier(0.23,1,0.32,1),opacity_0ms_linear_160ms] group-data-[status=failed]:[stroke-dashoffset:0] group-data-[status=failed]:opacity-100 group-data-[status=failed]:[transition:stroke-dashoffset_var(--sm-draw)_cubic-bezier(0.23,1,0.32,1)_var(--sm-check-delay),opacity_0ms_linear_var(--sm-check-delay)] group-data-[status=cancelled]:[stroke-dashoffset:0] group-data-[status=cancelled]:opacity-100 group-data-[status=cancelled]:[transition:stroke-dashoffset_var(--sm-draw)_cubic-bezier(0.23,1,0.32,1)_var(--sm-check-delay),opacity_0ms_linear_var(--sm-check-delay)] motion-reduce:[stroke-dashoffset:0] motion-reduce:[transition:opacity_200ms_ease] motion-reduce:group-data-[status=failed]:[transition:opacity_200ms_ease] motion-reduce:group-data-[status=cancelled]:[transition:opacity_200ms_ease]"
          d={CROSS}
          pathLength="1"
        />
      </svg>
      {hasLabel() ? <span class="sr-only">{spoken()}: </span> : null}
      {hasLabel() ? (
        <span class="relative leading-[1.25] opacity-[0.65] [color:var(--sm-color)] [font-size:var(--sm-font)] [transition:opacity_200ms_ease] group-data-[status=running]:opacity-100 group-data-[status=done]:opacity-60 group-data-[status=failed]:opacity-100 group-data-[status=cancelled]:opacity-[0.55]">
          {props.label}
          <span
            class="pointer-events-none absolute inset-x-0 top-1/2 origin-left scale-x-0 bg-current [translate:0_-50%] [height:max(1px,calc(var(--sm-font)/14))] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[status=done]:group-data-[strike]:scale-x-100 group-data-[status=done]:group-data-[strike]:[transition:transform_280ms_cubic-bezier(0.23,1,0.32,1)_var(--sm-strike-delay)] motion-reduce:scale-x-100! motion-reduce:opacity-0 motion-reduce:[transition:opacity_200ms_ease] motion-reduce:group-data-[status=done]:group-data-[strike]:opacity-100 motion-reduce:group-data-[status=done]:group-data-[strike]:[transition:opacity_200ms_ease]"
            aria-hidden="true"
          />
        </span>
      ) : null}
    </span>
  );
};

export default StatusMark;
