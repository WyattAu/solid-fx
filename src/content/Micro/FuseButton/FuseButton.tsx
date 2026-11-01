import { createEffect, createSignal, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import HugeiconsIcon from '@/lib/HugeiconsIcon';
import { Archive02Icon, Tick02Icon, Undo02Icon } from '@hugeicons/core-free-icons';

export type FusePosition = 'outline' | 'bottom' | 'top';
export type FuseCommitOn = 'press' | 'fuseEnd';
export type FuseSettle = 'reset' | 'stay';
export type FusePhase = 'idle' | 'armed' | 'settled';
export type FuseSize = 'sm' | 'md' | 'lg';

export interface FuseButtonProps {
  label?: string;
  undoLabel?: string;
  doneLabel?: string;
  icon?: JSX.Element;
  color?: string;
  background?: string;
  fuseColor?: string;
  size?: FuseSize;
  radius?: number;
  undoWindow?: number;
  fuse?: FusePosition;
  fuseThickness?: number;
  crossfadeMs?: number;
  commitOn?: FuseCommitOn;
  pauseOnHover?: boolean;
  settle?: FuseSettle;
  disabled?: boolean;
  onCommit?: (reason: FuseCommitOn) => void;
  onUndo?: () => void;
  onFuseEnd?: () => void;
  onPhaseChange?: (phase: FusePhase) => void;
  className?: string;
  class?: string;
  type?: 'button' | 'submit' | 'reset';
}

const LINE: Keyframe[] = [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }];
const OUTLINE: Keyframe[] = [{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }];
const SIZES: Record<FuseSize, { height: number; font: number; icon: number; px: number }> = {
  sm: { height: 36, font: 13, icon: 14, px: 16 },
  md: { height: 44, font: 14, icon: 15, px: 20 },
  lg: { height: 52, font: 15, icon: 17, px: 24 }
};

// Stand-in for React's useId: a module-level counter is enough for aria wiring.
let uid = 0;

const FuseButton = (props: FuseButtonProps) => {
  const color = () => props.color ?? '#f5f5f5';
  const background = () => props.background ?? '#27272a';
  const fuseColor = () => props.fuseColor ?? '#f5a524';
  const size = () => props.size ?? 'md';
  const radius = () => props.radius ?? 22;
  const fuse = () => props.fuse ?? 'outline';
  const commitOn = () => props.commitOn ?? 'press';
  const pauseOnHover = () => props.pauseOnHover ?? true;
  const settle = () => props.settle ?? 'reset';
  const disabled = () => props.disabled ?? false;

  const [phase, setPhase] = createSignal<FusePhase>('idle');
  const [instant, setInstant] = createSignal(false);
  let rootEl!: HTMLSpanElement;
  let idleEl: HTMLButtonElement | undefined;
  let undoEl: HTMLButtonElement | undefined;
  let lineEl: HTMLElement | undefined;
  let rimEl: SVGRectElement | undefined;
  let anim: Animation | null = null;
  const pause = { hover: false, hidden: false, canHoverPause: false };
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  let undoWindowMs = props.undoWindow ?? 4000;
  const statusId = `fuse-button-status-${++uid}`;
  const preset = () => SIZES[size()] || SIZES.md;

  const go = (next: FusePhase) => {
    setInstant(lastInput === 'keyboard');
    setPhase(next);
    untrack(() => props.onPhaseChange?.(next));
  };

  const syncPlayState = () => {
    const a = anim;
    if (!a) return;
    const { hover, hidden } = pause;
    if (hover || hidden) {
      if (a.playState === 'running') a.pause();
    } else if (a.playState === 'paused') {
      a.play();
    }
  };

  const light = (from = 0) => {
    const el = fuse() === 'outline' ? rimEl : lineEl;
    if (!el) return;
    anim?.cancel();
    const a = el.animate(fuse() === 'outline' ? OUTLINE : LINE, {
      duration: undoWindowMs,
      easing: 'linear',
      fill: 'forwards'
    });
    if (from) a.currentTime = from;
    a.onfinish = () => {
      untrack(() => {
        props.onFuseEnd?.();
        if (commitOn() === 'fuseEnd') props.onCommit?.('fuseEnd');
      });
      lastInput = 'pointer';
      go(settle() === 'stay' ? 'settled' : 'idle');
    };
    anim = a;
    syncPlayState();
  };

  const arm = () => {
    if (disabled() || phase() !== 'idle') return;
    undoWindowMs = props.undoWindow ?? 4000;
    light();
    pause.canHoverPause = false;
    pause.hover = false;
    if (commitOn() === 'press') untrack(() => props.onCommit?.('press'));
    go('armed');
  };

  const undo = () => {
    if (phase() !== 'armed') return;
    const a = anim;
    if (a) {
      a.onfinish = null;
      a.pause();
    }
    untrack(() => props.onUndo?.());
    go('idle');
  };

  // Upstream: effect on [phase] — move focus with the phase.
  createEffect(() => {
    const p = phase();
    const inside = rootEl?.contains(document.activeElement);
    if (p === 'armed') undoEl?.focus({ preventScroll: true });
    else if (inside) (p === 'idle' ? idleEl : rootEl)?.focus({ preventScroll: true });
  });

  onMount(() => {
    const onVisibility = () => {
      pause.hidden = document.hidden;
      syncPlayState();
    };
    document.addEventListener('visibilitychange', onVisibility);
    onCleanup(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      anim?.cancel();
    });
  });

  // Upstream: effect on [fuse] — restart the fuse mid-flight when the style flips while armed.
  createEffect(() => {
    void fuse();
    untrack(() => {
      const a = anim;
      if (!a || phase() !== 'armed') return;
      light(Number(a.currentTime) || 0);
    });
  });

  // Upstream: effect on [pauseOnHover].
  createEffect(() => {
    if (pauseOnHover()) return;
    pause.hover = false;
    syncPlayState();
  });

  const handlePointerDown = (e: PointerEvent) => {
    lastInput = 'pointer';
    const pressable = phase() === 'armed' || (phase() === 'idle' && !disabled());
    if (e.button === 0 && pressable && rootEl) rootEl.dataset.pressed = '';
  };
  const release = () => {
    if (rootEl) delete rootEl.dataset.pressed;
  };
  const handlePointerEnter = (e: PointerEvent) => {
    if (pauseOnHover() && e.pointerType === 'mouse' && pause.canHoverPause) {
      pause.hover = true;
      syncPlayState();
    }
  };
  const handlePointerLeave = (e: PointerEvent) => {
    release();
    if (e.pointerType !== 'mouse') return;
    pause.canHoverPause = true;
    pause.hover = false;
    syncPlayState();
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard';
    if (e.key === 'Escape' && phase() === 'armed') {
      e.preventDefault();
      lastInput = 'keyboard';
      undo();
    }
  };

  const actionIcon = () => props.icon ?? <HugeiconsIcon icon={Archive02Icon} size={preset().icon} strokeWidth={1.8} />;

  return (
    <span
      ref={rootEl}
      tabIndex={-1}
      class={`group relative inline-grid h-[var(--fb-h)] grid-cols-[minmax(0,1fr)] isolate touch-manipulation select-none overflow-hidden rounded-[var(--fb-radius)] font-medium leading-none tracking-[0.01em] outline-none [font-family:inherit] [font-size:var(--fb-fs)] [background:var(--fb-bg)] [color:var(--fb-ink)] [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] [transition:transform_160ms_var(--fb-ease-out)] data-[pressed]:[transform:scale(var(--fb-press))] motion-reduce:data-[pressed]:[transform:none] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:[outline-color:color-mix(in_srgb,var(--fb-ink)_60%,transparent)] data-[phase=idle]:has-[.fb-idle:disabled]:opacity-[0.55] contrast-more:[box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--fb-ink)_40%,transparent)]${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      data-phase={phase()}
      data-fuse={fuse()}
      data-instant={instant() ? '' : undefined}
      aria-disabled={phase() === 'settled' || undefined}
      style={{
        '--fb-ink': color(),
        '--fb-bg': background(),
        '--fb-fuse': fuseColor(),
        '--fb-fuse-h': `${props.fuseThickness ?? 1.5}px`,
        '--fb-radius': `${radius()}px`,
        '--fb-fade': `${props.crossfadeMs ?? 200}ms`,
        '--fb-h': `${preset().height}px`,
        '--fb-fs': `${preset().font}px`,
        '--fb-icon': `${preset().icon}px`,
        '--fb-px': `${preset().px}px`,
        '--fb-press': 0.97,
        '--fb-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)'
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={(el: HTMLButtonElement) => {
          idleEl = el;
        }}
        type={props.type ?? 'button'}
        class="fb-idle relative [grid-area:1/1] inline-flex h-full w-full min-w-0 items-center justify-center gap-2 m-0 border-0 bg-transparent px-[var(--fb-px)] whitespace-nowrap cursor-pointer invisible opacity-0 [filter:blur(2px)] [color:inherit] [font:inherit] [letter-spacing:inherit] [transition:opacity_var(--fb-fade)_ease,filter_var(--fb-fade)_ease,visibility_0s_linear_var(--fb-fade),background-color_160ms_ease] motion-reduce:[filter:none] motion-reduce:[transition:opacity_var(--fb-fade)_ease,visibility_0s_linear_var(--fb-fade)] group-data-[instant]:[transition-duration:0s] group-data-[phase=idle]:visible group-data-[phase=idle]:opacity-100 group-data-[phase=idle]:[filter:blur(0)] group-data-[phase=idle]:[transition-delay:0s] disabled:cursor-default focus-visible:outline-none [@media(hover:hover)_and_(pointer:fine)]:enabled:hover:[background:color-mix(in_srgb,var(--fb-ink)_7%,transparent)]"
        disabled={disabled()}
        inert={phase() !== 'idle'}
        onClick={arm}
      >
        <span class="inline-flex h-[var(--fb-icon)] w-[var(--fb-icon)] [&>svg]:h-full [&>svg]:w-full" aria-hidden="true">
          {actionIcon()}
        </span>
        {props.label ?? 'Archive'}
      </button>
      <button
        ref={(el: HTMLButtonElement) => {
          undoEl = el;
        }}
        type="button"
        class="relative [grid-area:1/1] inline-flex h-full w-full min-w-0 items-center justify-center gap-2 m-0 border-0 bg-transparent px-[var(--fb-px)] whitespace-nowrap cursor-pointer invisible opacity-0 [filter:blur(2px)] [color:inherit] [font:inherit] [letter-spacing:inherit] [transition:opacity_var(--fb-fade)_ease,filter_var(--fb-fade)_ease,visibility_0s_linear_var(--fb-fade),background-color_160ms_ease] motion-reduce:[filter:none] motion-reduce:[transition:opacity_var(--fb-fade)_ease,visibility_0s_linear_var(--fb-fade)] group-data-[instant]:[transition-duration:0s] group-data-[phase=armed]:visible group-data-[phase=armed]:opacity-100 group-data-[phase=armed]:[filter:blur(0)] group-data-[phase=armed]:[transition-delay:0s] focus-visible:outline-none [@media(hover:hover)_and_(pointer:fine)]:hover:[background:color-mix(in_srgb,var(--fb-ink)_7%,transparent)]"
        aria-describedby={statusId}
        aria-keyshortcuts="Escape"
        inert={phase() !== 'armed'}
        onClick={undo}
      >
        <span
          class="inline-flex h-[var(--fb-icon)] w-[var(--fb-icon)] [&>svg]:h-full [&>svg]:w-full [transform:rotate(-70deg)] [transition:transform_var(--fb-fade)_var(--fb-ease-out)] group-data-[phase=armed]:[transform:rotate(0deg)] motion-reduce:transition-none motion-reduce:[transform:none]"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={Undo02Icon} size={preset().icon} strokeWidth={2} />
        </span>
        {props.undoLabel ?? 'Undo'}
        {fuse() !== 'outline' ? (
          <i
            ref={(el: HTMLElement) => {
              lineEl = el;
            }}
            class="pointer-events-none absolute inset-x-0 bottom-0 h-[var(--fb-fuse-h)] origin-left [background:var(--fb-fuse)] [box-shadow:0_0_6px_color-mix(in_srgb,var(--fb-fuse)_55%,transparent)] group-data-[fuse=top]:top-0 group-data-[fuse=top]:bottom-auto forced-colors:[background:Highlight]"
            aria-hidden="true"
          />
        ) : null}
      </button>
      <span
        class="relative [grid-area:1/1] inline-flex h-full w-full min-w-0 items-center justify-center gap-2 m-0 border-0 bg-transparent px-[var(--fb-px)] whitespace-nowrap cursor-pointer invisible opacity-0 [filter:blur(2px)] [color:inherit] [font:inherit] [letter-spacing:inherit] [transition:opacity_var(--fb-fade)_ease,filter_var(--fb-fade)_ease,visibility_0s_linear_var(--fb-fade),background-color_160ms_ease] motion-reduce:[filter:none] motion-reduce:[transition:opacity_var(--fb-fade)_ease,visibility_0s_linear_var(--fb-fade)] group-data-[instant]:[transition-duration:0s] group-data-[phase=settled]:visible group-data-[phase=settled]:opacity-100 group-data-[phase=settled]:[filter:blur(0)] group-data-[phase=settled]:[transition-delay:0s] cursor-default"
        inert={phase() !== 'settled'}
      >
        <span class="inline-flex h-[var(--fb-icon)] w-[var(--fb-icon)] [&>svg]:h-full [&>svg]:w-full" aria-hidden="true">
          <HugeiconsIcon icon={Tick02Icon} size={preset().icon} strokeWidth={2.2} />
        </span>
        {props.doneLabel ?? 'Archived'}
      </span>
      {fuse() === 'outline' ? (
        <svg
          class="pointer-events-none absolute inset-0 h-full w-full overflow-visible opacity-0 [filter:drop-shadow(0_0_3px_color-mix(in_srgb,var(--fb-fuse)_60%,transparent))] [transition:opacity_var(--fb-fade)_ease] group-data-[phase=armed]:opacity-100 group-data-[instant]:[transition-duration:0s]"
          aria-hidden="true"
        >
          <rect
            ref={(el: SVGRectElement) => {
              rimEl = el;
            }}
            pathLength="1"
            class="fill-none [x:calc(var(--fb-fuse-h)/2)] [y:calc(var(--fb-fuse-h)/2)] [width:calc(100%-var(--fb-fuse-h))] [height:calc(100%-var(--fb-fuse-h))] [rx:max(0px,calc(var(--fb-radius)-var(--fb-fuse-h)/2))] [stroke:var(--fb-fuse)] [stroke-width:var(--fb-fuse-h)] [stroke-linecap:round] [stroke-dasharray:1] forced-colors:[stroke:Highlight]"
          />
        </svg>
      ) : null}
      <span class="sr-only" id={statusId} role="status" aria-live="polite">
        {phase() === 'idle' ? '' : (props.doneLabel ?? 'Archived')}
      </span>
    </span>
  );
};

export default FuseButton;
