import { createEffect, createSignal, For, onCleanup, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, type AnimationPlaybackControls } from 'motion';
import HugeiconsIcon from '@/lib/HugeiconsIcon';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';
import { ArrowDown01Icon, SparklesIcon, Tick02Icon } from '@hugeicons/core-free-icons';

export type ThoughtLineGlyph = 'sparkle' | 'dot' | 'none' | JSX.Element;

export interface ThoughtLineProps {
  label?: string;
  doneLabel?: string;
  renderLabel?: (text: string, working: boolean) => JSX.Element;
  glyph?: ThoughtLineGlyph;
  steps?: string[];
  collapsible?: boolean;
  collapseOnSettle?: boolean;
  color?: string;
  glyphColor?: string;
  fontSize?: number;
  breathPeriod?: number;
  breathDepth?: number;
  shimmer?: boolean;
  shimmerDuration?: number;
  settleDuration?: number;
  settleBlur?: number;
  working?: boolean;
  settleAfter?: number;
  elapsed?: number;
  showTimer?: boolean;
  onSettle?: (seconds: number) => void;
  className?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const GLYPH_DONE = 0.55;
const EMPTY_STEPS: string[] = [];

const fmt = (ds: number) =>
  ds < 600 ? `${(ds / 10).toFixed(1)}s` : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;
const spoken = (ds: number) =>
  ds < 600
    ? `${(ds / 10).toFixed(1)} seconds`
    : `${Math.floor(ds / 600)} minutes ${((ds % 600) / 10).toFixed(1)} seconds`;

const STYLE = `
@keyframes thought-line-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
@keyframes thought-line-shimmer { to { background-position: -125% 0; } }
`;

const ThoughtLine = (props: ThoughtLineProps) => {
  const reduce = usePrefersReducedMotion();
  const [autoSettled, setAutoSettled] = createSignal(false);
  const [open, setOpen] = createSignal(true);
  const [announce, setAnnounce] = createSignal(props.label ?? 'Thinking…');
  const isWorking = () => (props.working ?? true) && !autoSettled();
  const doneText = () => props.doneLabel || ((props.showTimer ?? true) ? 'Thought for' : 'Done thinking');
  const steps = () => props.steps ?? EMPTY_STEPS;
  const hasTrace = () => steps().length > 0;
  const depth = () => (reduce() ? Math.min(props.breathDepth ?? 0.45, 0.2) : (props.breathDepth ?? 0.45));
  const period = () => (reduce() ? (props.breathPeriod ?? 1.6) * 1.5 : (props.breathPeriod ?? 1.6));
  const trough = () => 1 - depth();
  const sheen = () => (props.shimmer ?? true) && !reduce();

  let glyphEl: HTMLSpanElement | null = null;
  let breathEl: HTMLSpanElement | null = null;
  let timerEl: HTMLSpanElement | null = null;
  let stackEl: HTMLSpanElement | null = null;
  let workEl: HTMLSpanElement | null = null;
  let doneEl: HTMLSpanElement | null = null;
  let ds = 0;
  let prevWorking = isWorking();

  createEffect(() => {
    if (props.working ?? true) setAutoSettled(false);
  });
  createEffect(() => {
    if (isWorking()) setOpen(true);
    else if (props.collapseOnSettle ?? true) setOpen(false);
  });

  createEffect(() => {
    const glyphNow = props.glyph;
    const glyphNode = glyphEl;
    const breathNode = breathEl;
    if (glyphNow === 'none' || !breathNode) return;
    const s = (props.settleDuration ?? 350) / 1000;
    const periodNow = period();
    const troughNow = trough();
    const loop = (el: HTMLElement, delay: number) =>
      animate(el, { opacity: [troughNow, 1, troughNow] }, { duration: periodNow, ease: EASE_IN_OUT, repeat: Infinity, delay });
    let cancelled = false;
    const running: AnimationPlaybackControls[] = [];
    if (isWorking()) {
      if (depth() > 0) {
        if (sheen()) running.push(animate(breathNode, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
        if (glyphNode) {
          const lead = animate(glyphNode, { opacity: troughNow }, { duration: 0.2, ease: EASE_OUT });
          running.push(lead);
          lead.then(() => {
            if (cancelled) return;
            running.push(loop(glyphNode, 0));
            if (!sheen()) running.push(loop(breathNode, 0.14));
          });
        } else if (!sheen()) {
          running.push(loop(breathNode, 0.14));
        }
      } else {
        if (glyphNode) running.push(animate(glyphNode, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
        running.push(animate(breathNode, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
      }
    } else {
      if (glyphNode) running.push(animate(glyphNode, { opacity: GLYPH_DONE }, { duration: s, ease: EASE_OUT }));
      running.push(animate(breathNode, { opacity: 1 }, { duration: s, ease: EASE_OUT }));
    }
    onCleanup(() => {
      cancelled = true;
      running.forEach(a => a.stop());
    });
  });

  const paint = (v: number) => {
    ds = v;
    if (timerEl) timerEl.textContent = fmt(v);
  };
  createEffect(() => {
    const elapsed = props.elapsed;
    if (elapsed != null) {
      paint(Math.round(elapsed * 10));
      return;
    }
    if (!isWorking()) return;
    const settleAfter = props.settleAfter ?? 0;
    const startedAt = performance.now();
    paint(0);
    const id = setInterval(() => {
      const v = Math.floor((performance.now() - startedAt) / 100);
      paint(v);
      if (settleAfter > 0 && v >= Math.round(settleAfter * 10)) setAutoSettled(true);
    }, 100);
    onCleanup(() => clearInterval(id));
  });

  createEffect(() => {
    const t = timerEl;
    const stack = stackEl;
    if (!t || !stack) return;
    const workingNow = isWorking();
    // Upstream deps: [isWorking, label, doneText, fontSize, showTimer]
    const deps = `${props.label}|${doneText()}|${props.fontSize ?? 16}|${props.showTimer ?? true}`;
    void deps;
    const place = (glide: boolean) => {
      const active = workingNow ? workEl : doneEl;
      if (!active) return;
      const shift = active.offsetWidth - stack.offsetWidth;
      if (!glide) t.style.transition = 'none';
      t.style.transform = `translateX(${shift}px)`;
      if (!glide) {
        void t.offsetWidth;
        t.style.transition = '';
      }
    };
    place(prevWorking !== workingNow);
    prevWorking = workingNow;
    const ro = new ResizeObserver(() => place(false));
    if (workEl) ro.observe(workEl);
    if (doneEl) ro.observe(doneEl);
    onCleanup(() => ro.disconnect());
  });

  createEffect(() => {
    if (isWorking()) {
      setAnnounce(props.label ?? 'Thinking…');
      return;
    }
    setAnnounce((props.showTimer ?? true) ? `${doneText()} ${spoken(ds)}` : doneText());
    untrack(() => props.onSettle?.(ds / 10));
  });

  const toggle = () => hasTrace() && (props.collapsible ?? true);
  const head = (
    <>
      {props.glyph !== undefined && props.glyph !== 'none' ? (
        <span
          ref={el => {
            glyphEl = el;
          }}
          class="mr-[0.2em] inline-flex h-[1.1em] w-[1.1em] flex-none [color:var(--tl-glyph)] [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
          aria-hidden="true"
        >
          {props.glyph === 'sparkle' ? (
            <HugeiconsIcon icon={SparklesIcon} size="100%" strokeWidth={2} />
          ) : props.glyph === 'dot' ? (
            <span class="m-auto h-[0.5em] w-[0.5em] rounded-full bg-current" />
          ) : (
            props.glyph
          )}
        </span>
      ) : null}
      <span
        ref={el => {
          stackEl = el;
        }}
        class="inline-grid"
        aria-hidden="true"
      >
        <span
          ref={el => {
            workEl = el;
          }}
          class="w-max opacity-0 [grid-area:1/1] [filter:blur(var(--tl-blur))] [transition:opacity_var(--tl-settle)_cubic-bezier(0.23,1,0.32,1),filter_var(--tl-settle)_cubic-bezier(0.23,1,0.32,1)] data-[active]:opacity-100 data-[active]:[filter:blur(0)] motion-reduce:[filter:none]! motion-reduce:[transition:opacity_var(--tl-settle)_ease]"
          data-active={isWorking() ? '' : undefined}
        >
          <span
            ref={el => {
              breathEl = el;
            }}
            class="group-data-[working]:data-[shimmer]:bg-clip-text group-data-[working]:data-[shimmer]:text-transparent group-data-[working]:data-[shimmer]:[background-image:linear-gradient(100deg,color-mix(in_srgb,var(--tl-color)_50%,transparent)_30%,var(--tl-color)_50%,color-mix(in_srgb,var(--tl-color)_50%,transparent)_70%)] group-data-[working]:data-[shimmer]:[background-size:250%_100%] group-data-[working]:data-[shimmer]:[background-position:125%_0] group-data-[working]:data-[shimmer]:[-webkit-text-fill-color:transparent] group-data-[working]:data-[shimmer]:[animation:thought-line-shimmer_var(--tl-shimmer)_linear_infinite] inline-block"
            data-shimmer={sheen() ? '' : undefined}
          >
            {props.renderLabel ? props.renderLabel(props.label ?? 'Thinking…', true) : (props.label ?? 'Thinking…')}
          </span>
        </span>
        <span
          ref={el => {
            doneEl = el;
          }}
          class="w-max opacity-0 [grid-area:1/1] [filter:blur(var(--tl-blur))] [transition:opacity_var(--tl-settle)_cubic-bezier(0.23,1,0.32,1),filter_var(--tl-settle)_cubic-bezier(0.23,1,0.32,1)] data-[active]:[opacity:var(--tl-done)] data-[active]:[filter:blur(0)] motion-reduce:[filter:none]! motion-reduce:[transition:opacity_var(--tl-settle)_ease]"
          data-active={isWorking() ? undefined : ''}
        >
          {props.renderLabel ? props.renderLabel(doneText(), false) : doneText()}
        </span>
      </span>
      {props.showTimer ?? true ? (
        <span
          ref={el => {
            timerEl = el;
          }}
          class="tabular-nums [opacity:var(--tl-timer)] [transition:opacity_var(--tl-settle)_ease,transform_var(--tl-settle)_cubic-bezier(0.77,0,0.175,1)] data-[done]:[opacity:var(--tl-done)] motion-reduce:[transition:opacity_var(--tl-settle)_ease]"
          data-done={isWorking() ? undefined : ''}
          aria-hidden="true"
        >
          0.0s
        </span>
      ) : null}
      {props.collapsible ?? true ? (
        <span
          class="ml-[0.1em] inline-flex opacity-0 [transition:opacity_200ms_ease,transform_200ms_cubic-bezier(0.23,1,0.32,1)] data-[on]:opacity-55 group-data-[open]:rotate-180"
          data-on={hasTrace() ? '' : undefined}
          aria-hidden="true"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size="1em" strokeWidth={2.2} />
        </span>
      ) : null}
      <span class="sr-only" role="status">
        {announce()}
      </span>
    </>
  );

  return (
    <div
      class={`group inline-flex flex-col items-start leading-[1.2] font-medium [color:var(--tl-color)] [font-family:inherit] [font-size:var(--tl-font)]${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      data-working={isWorking() ? '' : undefined}
      data-open={open() && hasTrace() ? '' : undefined}
      style={{
        '--tl-font': `${props.fontSize ?? 16}px`,
        '--tl-color': props.color ?? 'currentColor',
        '--tl-glyph': props.glyphColor || (props.color ?? 'currentColor'),
        '--tl-settle': `${props.settleDuration ?? 350}ms`,
        '--tl-blur': `${props.settleBlur ?? 2}px`,
        '--tl-shimmer': `${props.shimmerDuration ?? 1.8}s`,
        ...props.style
      }}
    >
      <style>{STYLE}</style>
      {props.collapsible ?? true ? (
        <button
          type="button"
          class="relative m-0 inline-flex cursor-default items-center gap-[0.3em] border-0 bg-transparent p-0 text-left whitespace-nowrap text-inherit outline-none [font:inherit] data-[toggle]:cursor-pointer data-[toggle]:[-webkit-tap-highlight-color:transparent]"
          data-toggle={toggle() ? '' : undefined}
          aria-expanded={toggle() ? open() : undefined}
          tabIndex={toggle() ? 0 : -1}
          onClick={() => {
            if (toggle()) setOpen(v => !v);
          }}
        >
          {head}
        </button>
      ) : (
        <div class="relative m-0 inline-flex cursor-default items-center gap-[0.3em] border-0 bg-transparent p-0 text-left whitespace-nowrap text-inherit outline-none [font:inherit] data-[toggle]:cursor-pointer data-[toggle]:[-webkit-tap-highlight-color:transparent]">
          {head}
        </div>
      )}
      {hasTrace() ? (
        <div
          class="grid w-0 min-w-full [grid-template-rows:0fr] [transition:grid-template-rows_var(--tl-settle)_cubic-bezier(0.23,1,0.32,1)] data-[open]:[grid-template-rows:1fr]"
          data-open={open() ? '' : undefined}
          aria-hidden={!open()}
        >
          <div class="min-h-0 overflow-x-visible overflow-y-clip">
            <div class="flex w-max flex-col gap-[0.45em] pt-[0.6em] pb-[0.2em] pl-[1.6em] text-[0.875em] font-normal whitespace-nowrap">
              <For each={steps()}>
                {(text, i) => {
                  const done = () => !isWorking() || i() < steps().length - 1;
                  return (
                    <div
                      class="group/step flex translate-y-0 items-center gap-[0.5em] opacity-100 [transition:opacity_200ms_cubic-bezier(0.23,1,0.32,1),transform_200ms_cubic-bezier(0.23,1,0.32,1)] starting:-translate-y-1 starting:opacity-0 motion-reduce:[transform:none]! motion-reduce:[transition:opacity_200ms_ease]"
                      data-done={done() ? '' : undefined}
                    >
                      <span class="inline-grid h-[1em] w-[1em] flex-none place-items-center opacity-55" aria-hidden="true">
                        {done() ? (
                          <HugeiconsIcon icon={Tick02Icon} size="1em" strokeWidth={2.5} />
                        ) : (
                          <i class="block h-[0.4em] w-[0.4em] rounded-full bg-current [animation:thought-line-pulse_1.6s_cubic-bezier(0.77,0,0.175,1)_infinite] motion-reduce:[animation-duration:2.4s]" />
                        )}
                      </span>
                      <span class="[transition:opacity_var(--tl-settle)_ease] group-data-[done]/step:opacity-55">{text}</span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ThoughtLine;
