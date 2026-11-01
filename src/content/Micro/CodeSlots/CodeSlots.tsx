import { createEffect, createMemo, createSignal, createUniqueId, For, Index, onCleanup, onMount, Show, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import type { AnimationPlaybackControlsWithThen, MotionValue } from 'motion';
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';
import HugeiconsIcon from '@/lib/HugeiconsIcon';
import { Tick02Icon } from '@hugeicons/core-free-icons';

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const WASH_IN = 0.3;
const WASH_OUT = 0.2;
const SINK_DELAY = 0.06;
const SINK_STEP = 0.03;
const CHECK_DELAY = 0.28;
const CHECK_RISE = 8;
const SINK_FADE = 0.6;

export type CodeSlotsStatus = 'idle' | 'error' | 'success';

export interface CodeSlotsProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  status?: CodeSlotsStatus;
  mask?: boolean;
  caret?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accentColor?: string;
  inkColor?: string;
  slotColor?: string;
  digitColor?: string;
  dangerColor?: string;
  slotSize?: number;
  gap?: number;
  radius?: number;
  bounce?: number;
  settle?: number;
  rise?: number;
  cascade?: number;
  ariaLabel?: string;
  className?: string;
  class?: string;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const digitsOf = (raw: string | undefined) => String(raw ?? '').replace(/\D/g, '');
const toSlots = (raw: string | undefined, n: number) => {
  const d = digitsOf(raw).slice(0, n);
  return Array.from({ length: n }, (_, i) => d[i] ?? '');
};
const firstEmptyOf = (slots: string[]) => {
  const i = slots.indexOf('');
  return i === -1 ? slots.length - 1 : i;
};
const isFull = (slots: string[]) => slots.every(Boolean);
const STYLE = '@keyframes code-slots-blink{0%,49.9%{opacity:1}50%,100%{opacity:0}}';

interface SlotProps {
  mv: MotionValue<number>;
  drop: MotionValue<number>;
  char: () => string;
  active: () => boolean;
  rise: () => number;
  sink: () => number;
}

// Upstream's Slot subscribed through useTransform; here the same derived
// values are written straight to the DOM from motion value change listeners.
function Slot(props: SlotProps) {
  const [shown, setShown] = createSignal(props.char());
  createEffect(() => {
    const c = props.char();
    if (c) setShown(c);
  });

  let fillEl: HTMLSpanElement | undefined;
  let charEl: HTMLSpanElement | undefined;

  const applyFill = () => {
    if (fillEl) fillEl.style.transform = `scale(${Math.max(props.mv.get(), 0)})`;
  };
  const applyChar = () => {
    if (!charEl) return;
    const t = props.mv.get();
    const d = props.drop.get();
    charEl.style.transform = `translateY(${(1 - t) * props.rise() + Math.max(d, 0) * props.sink()}px)`;
    charEl.style.opacity = String(clamp01(t) * (1 - clamp01(d / SINK_FADE)));
  };

  createEffect(() => {
    const mv = props.mv;
    const drop = props.drop;
    const offs = [mv.on('change', applyFill), mv.on('change', applyChar), drop.on('change', applyChar)];
    applyFill();
    applyChar();
    onCleanup(() => {
      offs.forEach(off => off());
      mv.stop();
      drop.stop();
    });
  });

  return (
    <span
      class="relative h-[var(--cs-height)] w-[var(--cs-size)] overflow-hidden rounded-[var(--cs-radius)] bg-[var(--cs-slot)] select-none [transition:background-color_200ms_ease] data-[active]:[background-color:color-mix(in_srgb,var(--cs-ink)_8%,var(--cs-slot))] in-data-[status=error]:[background-color:color-mix(in_srgb,var(--cs-danger)_20%,var(--cs-slot))] in-data-[status=error]:data-[active]:[background-color:color-mix(in_srgb,var(--cs-danger)_20%,var(--cs-slot))] [@media(hover:hover)_and_(pointer:fine)]:group-hover/row:in-data-[status=idle]:not-in-data-[disabled]:not-data-[active]:[background-color:color-mix(in_srgb,var(--cs-ink)_4%,var(--cs-slot))]"
      data-active={props.active() ? '' : undefined}
      data-filled={props.char() ? '' : undefined}
      aria-hidden="true"
    >
      <span
        ref={fillEl}
        class="absolute inset-0 origin-center rounded-[inherit] bg-[var(--cs-accent)] [transition:background-color_200ms_ease] in-data-[status=error]:bg-[var(--cs-danger)]"
      />
      <Show when={shown()}>
        <span
          ref={(el) => {
            charEl = el;
            applyChar();
          }}
          class="absolute inset-0 z-[2] grid place-items-center text-[length:var(--cs-font)] leading-none font-semibold tabular-nums [font-family:inherit] [color:var(--cs-digit)] motion-reduce:transform-none! motion-reduce:[transition:opacity_150ms_ease]"
        >
          {shown()}
        </span>
      </Show>
    </span>
  );
}

const CodeSlots = (props: CodeSlotsProps) => {
  const length = () => props.length ?? 6;
  const status = () => props.status ?? 'idle';
  const slotSize = () => props.slotSize ?? 44;
  const gap = () => props.gap ?? 8;
  const radius = () => props.radius ?? 12;
  const bounce = () => props.bounce ?? 0.2;
  const settle = () => props.settle ?? 0.3;
  const rise = () => props.rise ?? 8;
  const cascade = () => props.cascade ?? 20;
  const reduce = usePrefersReducedMotion();

  const uid = createUniqueId();
  let inputEl: HTMLInputElement | undefined;
  let rowEl: HTMLDivElement | undefined;
  let caretEl: HTMLSpanElement | undefined;
  let washEl: HTMLSpanElement | undefined;
  let checkInnerEl: HTMLSpanElement | undefined;

  const [slots, setSlots] = createSignal(toSlots(props.value ?? props.defaultValue, length()));
  const [active, setActive] = createSignal(firstEmptyOf(slots()));
  const [focused, setFocused] = createSignal(false);
  const [veiled, setVeiled] = createSignal(status() === 'success');
  const activeMv = motionValue(active());
  const openMv = motionValue(status() === 'success' ? 1 : 0);
  const checkMv = motionValue(status() === 'success' ? 1 : 0);

  // Mirror of `slots` for synchronous reads (upstream's slotsRef).
  let slotsRef = slots();
  let glide = new Set<number>();
  let target: number[] = [];
  let draining = false;
  let drainTimer: ReturnType<typeof setTimeout> | undefined;
  let emitted = digitsOf(props.value ?? props.defaultValue).slice(0, length());
  let statusRef: CodeSlotsStatus = status();

  // Upstream: useMemo(() => ({ mvs, drops }), [length]) — rebuilt per length.
  const springs = createMemo(() => ({
    mvs: Array.from({ length: length() }, (_, i) => motionValue(slotsRef[i] ? 1 : 0)),
    drops: Array.from({ length: length() }, () => motionValue(status() === 'success' ? 1 : 0))
  }));
  const pitch = () => slotSize() + gap();
  const height = () => Math.round(slotSize() * 1.18);
  const washRadius = () => Math.min(radius(), slotSize() / 2);

  const drive = (i: number, to: number, delayMs = 0) => {
    const mv = springs().mvs[i];
    if (!mv) return;
    target[i] = to;
    if (reduce()) {
      mv.jump(to);
      return;
    }
    animate(mv, to, { type: 'spring', duration: settle(), bounce: bounce(), delay: delayMs / 1000 });
  };
  const land = (i: number, delayMs = 0) => {
    const mv = springs().mvs[i];
    if (mv.get() > 0) mv.jump(0);
    drive(i, 1, delayMs);
  };
  const moveActive = (next: number, crossed: number[]) => {
    crossed.forEach(j => glide.add(j));
    activeMv.jump(next);
    setActive(next);
  };
  const jumpActive = (next: number) => {
    glide.clear();
    activeMv.jump(next);
    setActive(next);
  };

  const updateCaret = () => {
    if (!caretEl) return;
    const a = activeMv.get();
    const mvs = springs().mvs;
    let x = a * pitch();
    for (let j = 0; j < mvs.length; j++) {
      const h = clamp01(mvs[j].get());
      if (!glide.has(j)) continue;
      const to = target[j];
      if (to === undefined || h === clamp01(to)) {
        glide.delete(j);
        continue;
      }
      x += j < a ? -(1 - h) * pitch() : h * pitch();
    }
    caretEl.style.transform = `translateX(${Math.min(Math.max(x, 0), (mvs.length - 1) * pitch())}px)`;
  };

  const applyWash = () => {
    if (washEl) washEl.style.clipPath = `inset(0 ${(1 - clamp01(openMv.get())) * 50}% round ${washRadius()}px)`;
  };
  const applyCheck = () => {
    if (!checkInnerEl) return;
    const c = checkMv.get();
    checkInnerEl.style.transform = `translateY(${(1 - c) * CHECK_RISE}px) scale(${0.85 + 0.15 * Math.max(c, 0)})`;
    checkInnerEl.style.opacity = String(clamp01(c));
  };

  onMount(() => {
    const offs = [activeMv.on('change', updateCaret), openMv.on('change', applyWash), checkMv.on('change', applyCheck)];
    updateCaret();
    applyWash();
    applyCheck();
    onCleanup(() => {
      offs.forEach(off => off());
      activeMv.stop();
      openMv.stop();
      checkMv.stop();
      clearTimeout(drainTimer);
    });
  });

  // Slot motion values are rebuilt when `length` changes — re-subscribe.
  createEffect(() => {
    const { mvs } = springs();
    const offs = mvs.map(mv => mv.on('change', updateCaret));
    onCleanup(() => offs.forEach(off => off()));
    updateCaret();
  });

  const commit = (next: string[]) => {
    const prev = slotsRef;
    slotsRef = next;
    setSlots(next);
    const code = next.join('');
    emitted = code;
    untrack(() => props.onChange?.(code));
    if (!isFull(prev) && isFull(next)) untrack(() => props.onComplete?.(code));
  };

  const insert = (raw: string, from = active()) => {
    const digits = digitsOf(raw);
    if (!digits) return;
    const next = [...slotsRef];
    const crossed: number[] = [];
    const step = reduce() ? 0 : cascade();
    let i = from;
    for (const ch of digits) {
      if (i >= length()) break;
      next[i] = ch;
      land(i, (i - from) * step);
      crossed.push(i);
      i += 1;
    }
    if (!crossed.length) return;
    commit(next);
    moveActive(Math.min(i, length() - 1), crossed);
  };
  const clearSlot = (i: number, stepBack = false) => {
    if (!slotsRef[i]) {
      if (stepBack) jumpActive(i);
      return;
    }
    const next = [...slotsRef];
    next[i] = '';
    drive(i, 0);
    commit(next);
    if (stepBack) moveActive(i, [i]);
  };

  const busy = () => (props.disabled ?? false) || draining || status() === 'success';
  const onKeyDown = (e: KeyboardEvent) => {
    if (busy() || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) {
      e.preventDefault();
      insert(k);
    } else if (k === 'Backspace') {
      e.preventDefault();
      if (slotsRef[active()]) clearSlot(active());
      else if (active() > 0) clearSlot(active() - 1, true);
    } else if (k === 'Delete') {
      e.preventDefault();
      clearSlot(active());
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      jumpActive(Math.max(active() - 1, 0));
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      jumpActive(Math.min(active() + 1, length() - 1));
    } else if (k === 'Home') {
      e.preventDefault();
      jumpActive(0);
    } else if (k === 'End') {
      e.preventDefault();
      jumpActive(length() - 1);
    }
  };
  const onPaste = (e: ClipboardEvent) => {
    if (busy()) return;
    e.preventDefault();
    insert(e.clipboardData?.getData('text') ?? '');
  };
  const onInput = (e: Event) => {
    if (busy()) return;
    const input = e.currentTarget as HTMLInputElement;
    const d = digitsOf(input.value);
    if (!d) return;
    insert(d, d.length === 1 ? active() : 0);
  };
  const onRowMouseDown = (e: MouseEvent) => {
    if (props.disabled) return;
    e.preventDefault();
    const row = rowEl;
    if (row && !draining && status() !== 'success') {
      const rect = row.getBoundingClientRect();
      const zoom = rect.width / (row.offsetWidth || rect.width) || 1;
      const i = Math.floor((e.clientX - rect.left) / zoom / pitch());
      jumpActive(Math.max(0, Math.min(i, firstEmptyOf(slotsRef))));
    }
    inputEl?.focus();
  };

  // Upstream: useEffect on [length] — resize the slot array in place.
  createEffect(() => {
    const len = length();
    glide.clear();
    target = [];
    const next = Array.from({ length: len }, (_, i) => slotsRef[i] ?? '');
    slotsRef = next;
    setSlots(next);
    jumpActive(firstEmptyOf(next));
    const code = next.join('');
    if (code !== emitted) {
      emitted = code;
      untrack(() => props.onChange?.(code));
    }
  });

  // Upstream: useEffect on [value, length] — controlled digits.
  createEffect(() => {
    const value = props.value;
    const len = length();
    untrack(() => {
      if (value === undefined) return;
      const clean = digitsOf(value).slice(0, len);
      if (clean === emitted) return;
      emitted = clean;
      const prev = slotsRef;
      const next = toSlots(clean, len);
      const hidden = status() === 'success';
      const landing: number[] = [];
      const leaving: number[] = [];
      next.forEach((ch, i) => {
        if (ch === prev[i]) return;
        (ch ? landing : leaving).push(i);
      });
      const step = reduce() || hidden ? 0 : cascade();
      landing.forEach((i, k) => land(i, k * step));
      leaving
        .reverse()
        .forEach((i, k) => {
          if (hidden) {
            target[i] = 0;
            springs().mvs[i]?.jump(0);
            springs().drops[i]?.jump(0);
          } else drive(i, 0, k * step);
        });
      slotsRef = next;
      setSlots(next);
      moveActive(firstEmptyOf(next), [...landing, ...leaving]);
      if (!isFull(prev) && isFull(next)) untrack(() => props.onComplete?.(clean));
    });
  });

  // Upstream: useEffect on [status] — success wash + error drain.
  createEffect(() => {
    const s = status();
    const was = untrack(() => statusRef);
    statusRef = s;
    let controls: AnimationPlaybackControlsWithThen[] = [];
    onCleanup(() => controls.forEach(control => control.stop()));
    if (s === 'success') {
      setVeiled(true);
      if (reduce()) {
        openMv.jump(1);
        springs().drops.forEach(d => d.jump(1));
        checkMv.jump(1);
        return;
      }
      controls.push(animate(openMv, 1, { duration: WASH_IN, ease: EASE_OUT }));
      springs().drops.forEach((d, k) =>
        controls.push(animate(d, 1, { type: 'spring', duration: 0.3, bounce: 0, delay: SINK_DELAY + k * SINK_STEP }))
      );
      controls.push(animate(checkMv, 1, { type: 'spring', duration: 0.35, bounce: bounce(), delay: CHECK_DELAY }));
      return;
    }
    if (was !== 'success') return;
    if (reduce()) {
      openMv.jump(0);
      checkMv.jump(0);
      springs().drops.forEach(d => d.jump(0));
      setVeiled(false);
      return;
    }
    controls.push(animate(checkMv, 0, { duration: 0.15, ease: EASE_OUT }));
    const open = animate(openMv, 0, { duration: WASH_OUT, ease: EASE_OUT, delay: 0.06 });
    controls.push(open);
    open.then(() => {
      if (openMv.get() === 0) setVeiled(false);
    });
    springs().drops.forEach(d => controls.push(animate(d, 0, { type: 'spring', duration: 0.3, bounce: 0, delay: 0.1 })));
  });

  // Upstream: useEffect on [status] — drain digits one by one on error.
  createEffect(() => {
    if (status() !== 'error') return;
    untrack(() => {
      const filled = slotsRef.map((c, i) => (c ? i : -1)).filter(i => i >= 0);
      if (!filled.length) return;
      filled.reverse();
      draining = true;
      const step = reduce() ? 0 : cascade();
      filled.forEach((i, k) => drive(i, 0, k * step));
      moveActive(
        0,
        slotsRef.map((_, j) => j)
      );
      clearTimeout(drainTimer);
      drainTimer = setTimeout(
        () => {
          draining = false;
          commit(Array.from({ length: length() }, () => ''));
        },
        reduce() ? 300 : (filled.length - 1) * step + settle() * 1000
      );
    });
  });

  createEffect(() => {
    if (props.autoFocus) inputEl?.focus();
  });

  const view = () => (slots().length === length() ? slots() : Array.from({ length: length() }, (_, i) => slots()[i] ?? ''));
  const showCaret = () =>
    (props.caret ?? true) &&
    focused() &&
    !props.disabled &&
    !veiled() &&
    status() !== 'success' &&
    (status() === 'error' || !view()[active()]);

  return (
    <div
      class={`relative inline-block${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      style={{
        '--cs-accent': props.accentColor ?? '#f5f5f5',
        '--cs-ink': props.inkColor ?? '#f5f5f5',
        '--cs-slot': props.slotColor ?? '#27272a',
        '--cs-digit': props.digitColor ?? '#18181b',
        '--cs-danger': props.dangerColor ?? '#ff3b30',
        '--cs-size': `${slotSize()}px`,
        '--cs-height': `${height()}px`,
        '--cs-gap': `${gap()}px`,
        '--cs-radius': `${Math.min(radius(), slotSize() / 2)}px`,
        '--cs-font': `${Math.round(slotSize() * 0.5)}px`
      }}
    >
      <style>{STYLE}</style>
      <div
        ref={rowEl}
        class="group/row relative inline-flex cursor-text touch-manipulation gap-[var(--cs-gap)] [-webkit-tap-highlight-color:transparent] [transition:opacity_200ms_ease] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
        data-status={status()}
        data-focused={focused() ? '' : undefined}
        data-disabled={props.disabled ? '' : undefined}
        onMouseDown={onRowMouseDown}
      >
        <input
          ref={inputEl}
          class="absolute inset-0 z-[4] m-0 cursor-[inherit] appearance-none border-0 bg-transparent p-0 text-[16px] text-transparent opacity-0 outline-0 [caret-color:transparent]"
          type="text"
          inputMode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]*"
          value=""
          maxLength={length()}
          aria-label={props.ariaLabel ?? 'One-time code'}
          aria-invalid={status() === 'error'}
          aria-describedby={`${uid}-count`}
          disabled={props.disabled}
          readOnly={status() === 'success'}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onInput={onInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Index each={view()}>
          {(ch, i) => (
            <Slot
              mv={springs().mvs[i]}
              drop={springs().drops[i]}
              char={() => ((props.mask ?? false) && ch() ? '•' : ch())}
              active={() => focused() && i === active()}
              rise={rise}
              sink={() => Math.round(height() * 0.5)}
            />
          )}
        </Index>
        <span
          ref={washEl}
          class="pointer-events-none absolute inset-0 z-[1] grid place-items-center rounded-[var(--cs-radius)] bg-[var(--cs-accent)] [color:var(--cs-digit)] motion-reduce:opacity-0 motion-reduce:[transition:opacity_200ms_ease] motion-reduce:in-data-[status=success]:opacity-100"
          aria-hidden="true"
        >
          <span
            ref={checkInnerEl}
            class="grid place-items-center motion-reduce:transform-none! motion-reduce:[transition:opacity_150ms_ease]"
          >
            <HugeiconsIcon icon={Tick02Icon} size={Math.round(slotSize() * 0.6)} strokeWidth={2.2} />
          </span>
        </span>
        <span
          class="pointer-events-none absolute top-1/4 left-[calc(var(--cs-size)/2_-_0.75px)] z-[3] h-1/2 w-[1.5px] opacity-0 data-[show]:opacity-100"
          aria-hidden="true"
          data-show={showCaret() ? '' : undefined}
        >
          <span ref={caretEl} class="block h-full w-full">
            <For each={[active()]}>
              {() => (
                <span class="block h-full w-full bg-[var(--cs-ink)] animate-[code-slots-blink_1s_linear_infinite] motion-reduce:animate-none" />
              )}
            </For>
          </span>
        </span>
      </div>
      <span id={`${uid}-count`} class="sr-only" aria-live="polite">
        {status() === 'success' ? 'Code accepted' : `${view().filter(Boolean).length} of ${length()} digits entered`}
      </span>
    </div>
  );
};

export default CodeSlots;
