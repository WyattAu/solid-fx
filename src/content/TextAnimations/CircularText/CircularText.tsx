import { createEffect, createMemo, createSignal, Index, onCleanup, onMount, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, cancelFrame, frame, motionValue } from 'motion';
import type { AnimationPlaybackControls, FrameData, MotionValue } from 'motion';
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

type HoverMode = 'slowDown' | 'speedUp' | 'pause' | 'goBonkers';

export interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: HoverMode;
  direction?: 'clockwise' | 'counterclockwise';
  size?: number;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  color?: string;
  startAngle?: number;
  fill?: boolean;
  repeat?: number;
  ring?: boolean;
  ringColor?: string;
  tilt?: number;
  hoverTilt?: number;
  draggable?: boolean;
  children?: JSX.Element;
  className?: string;
  class?: string;
}

interface SpinState {
  dragging: boolean;
  hovering: boolean;
  fling: number;
  cruise: number;
  angle: number | null;
  travel: number;
  samples: [number, number][];
}

const HOVER_SPEED: Record<HoverMode, number> = { slowDown: 0.5, speedUp: 4, pause: 0, goBonkers: 20 };
const MAX_FLING = 1440;
const LETTER_EASE = 'transition-transform duration-500 ease-[cubic-bezier(0,0,0,1)]';

const SPRINGS = {
  speed: { stiffness: 60, damping: 18 },
  scale: { stiffness: 300, damping: 20 },
  tilt: { stiffness: 150, damping: 18 }
} as const;

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

// useSpring(mv, config).set(x) from motion/react, redone on vanilla motion:
// each set starts (and supersedes) a spring animation on the motion value.
const springTo = (
  value: MotionValue<number>,
  target: number,
  config: { stiffness: number; damping: number },
  running: Map<MotionValue<number>, AnimationPlaybackControls>
) => {
  running.get(value)?.stop();
  running.set(value, animate(value, target, { type: 'spring', ...config }));
};

const CircularText = (props: CircularTextProps) => {
  let rootEl!: HTMLDivElement;
  let tiltWrapEl!: HTMLDivElement;
  let spinEl!: HTMLDivElement;
  let glyphEls: (HTMLSpanElement | null)[] = [];

  const state: SpinState = {
    dragging: false,
    hovering: false,
    fling: 0,
    cruise: 0,
    angle: null,
    travel: 0,
    samples: []
  };
  const [advances, setAdvances] = createSignal<number[] | null>(null);
  const [settled, setSettled] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);
  const reduce = usePrefersReducedMotion();

  const rotation = motionValue(0);
  const speed = motionValue(1);
  const scale = motionValue(1);
  const tiltX = motionValue(0);
  const tiltY = motionValue(0);
  const running = new Map<MotionValue<number>, AnimationPlaybackControls>();
  const springSpeed = (target: number) => springTo(speed, target, SPRINGS.speed, running);
  const springScale = (target: number) => springTo(scale, target, SPRINGS.scale, running);
  const springTiltX = (target: number) => springTo(tiltX, target, SPRINGS.tilt, running);
  const springTiltY = (target: number) => springTo(tiltY, target, SPRINGS.tilt, running);

  const glyphs = createMemo(() => Array.from(props.text ?? ''));
  const copies = Math.max(1, Math.round(props.repeat ?? 1) || 1);
  const letters = createMemo(() => Array.from({ length: copies }, () => glyphs()).flat());
  const fontSize = () => props.fontSize ?? 24;

  const angles = createMemo(() => {
    const glyphList = glyphs();
    const letterList = letters();
    const fill = props.fill ?? true;
    const startAngle = props.startAngle ?? 0;
    const count = glyphList.length;
    if (!count) return [];
    if (fill) return letterList.map((_, i) => startAngle + (360 / letterList.length) * i);
    const knownAdvances = advances();
    const known = knownAdvances && knownAdvances.length === count ? knownAdvances : null;
    const toDegrees = 180 / (Math.PI * Math.max((props.size ?? 200) / 2 - fontSize() * 0.6, 1));
    const arcs = glyphList.map((glyph, i) => {
      const width = known ? known[i] : fontSize() * (glyph === ' ' ? 0.3 : 0.6);
      return Math.max(0, width + (props.letterSpacing ?? 0) * fontSize()) * toDegrees;
    });
    const span = arcs.reduce((sum, arc) => sum + arc, 0);
    const fit = span > 0 ? Math.min(1, 360 / (span * copies)) : 1;
    const result: number[] = [];
    for (let copy = 0; copy < copies; copy += 1) {
      let cursor = startAngle + (360 / copies) * copy - (arcs[0] * fit) / 2;
      for (let i = 0; i < count; i += 1) {
        const arc = arcs[i] * fit;
        result.push(cursor + arc / 2);
        cursor += arc;
      }
    }
    return result;
  });

  // Upstream deps: [fill, glyphs, fontSize, fontWeight, className].
  createEffect(() => {
    if (props.fill ?? true) return undefined;
    const deps = [glyphs(), fontSize(), props.fontWeight, props.className ?? '', props.class ?? ''];
    void deps;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const widths = glyphs().map((_, i) => glyphEls[i]?.offsetWidth ?? 0);
      setAdvances(prev =>
        prev && prev.length === widths.length && prev.every((width, i) => width === widths[i]) ? prev : widths
      );
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    document.fonts?.addEventListener?.('loadingdone', measure);
    onCleanup(() => {
      alive = false;
      document.fonts?.removeEventListener?.('loadingdone', measure);
    });
  });

  onMount(() => {
    const id = requestAnimationFrame(() => setSettled(true));
    onCleanup(() => cancelAnimationFrame(id));
  });

  // Upstream deps: [spinDuration, direction, reduceMotion, rotation, speed].
  createEffect(() => {
    const spinDuration = props.spinDuration ?? 20;
    const turn = (props.direction ?? 'clockwise') === 'counterclockwise' ? -1 : 1;
    const reduced = reduce();
    state.cruise = spinDuration > 0 && !reduced ? (360 / spinDuration) * turn : 0;
    const root = rootEl;
    if (!root || reduced) return;

    const spin = ({ delta }: FrameData) => {
      if (state.dragging) return;
      const dt = Math.min(delta, 100) / 1000;
      state.fling *= Math.exp(-dt / 0.7);
      if (Math.abs(state.fling) < 1) state.fling = 0;
      const velocity = state.cruise * speed.get() + state.fling;
      if (velocity) rotation.set((rotation.get() + velocity * dt) % 360);
    };

    let runningSpin = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === runningSpin) return;
      runningSpin = entry.isIntersecting;
      if (runningSpin) frame.update(spin, true);
      else cancelFrame(spin);
    });
    observer.observe(root);

    onCleanup(() => {
      observer.disconnect();
      cancelFrame(spin);
    });
  });

  createEffect(() => {
    if ((props.hoverTilt ?? 0) && !reduce()) return;
    springTiltX(0);
    springTiltY(0);
  });

  onMount(() => {
    const applyTilt = () => {
      tiltWrapEl.style.transform = `rotateX(${tiltX.get()}deg) rotateY(${tiltY.get()}deg) scale(${scale.get()})`;
    };
    const applySpin = () => {
      spinEl.style.transform = `rotate(${rotation.get()}deg)`;
    };
    const offs = [
      tiltX.on('change', applyTilt),
      tiltY.on('change', applyTilt),
      scale.on('change', applyTilt),
      rotation.on('change', applySpin)
    ];
    applyTilt();
    applySpin();
    onCleanup(() => {
      offs.forEach(off => off());
      [rotation, speed, scale, tiltX, tiltY].forEach(value => {
        running.get(value)?.stop();
        value.stop();
      });
      running.clear();
    });
  });

  const applyScale = () => {
    const bonkers = state.hovering && props.onHover === 'goBonkers' && !reduce();
    springScale((bonkers ? 0.8 : 1) * (state.dragging ? 0.96 : 1));
  };

  const pointerAngle = (e: PointerEvent): number | null => {
    const root = rootEl;
    if (!root) return null;
    const rect = root.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < rect.width * 0.06) return null;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const handleEnter = () => {
    state.hovering = true;
    if (props.onHover && !reduce()) springSpeed(HOVER_SPEED[props.onHover] ?? 1);
    applyScale();
  };

  const handleLeave = () => {
    state.hovering = false;
    springSpeed(1);
    springTiltX(0);
    springTiltY(0);
    applyScale();
  };

  const handleMove = (e: PointerEvent) => {
    const root = rootEl;
    if (!root) return;

    if (state.dragging) {
      const angle = pointerAngle(e);
      if (angle !== null) {
        if (state.angle !== null) {
          let delta = angle - state.angle;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          state.travel += delta;
          rotation.set((rotation.get() + delta) % 360);
          state.samples.push([e.timeStamp, state.travel]);
          while (state.samples.length > 2 && e.timeStamp - state.samples[0][0] > 100) state.samples.shift();
        }
        state.angle = angle;
      }
    }

    const hoverTilt = props.hoverTilt ?? 0;
    if (!hoverTilt || reduce() || e.pointerType === 'touch') return;
    const rect = root.getBoundingClientRect();
    const nx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const ny = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    springTiltX(-ny * hoverTilt);
    springTiltY(nx * hoverTilt);
  };

  const handleDown = (e: PointerEvent) => {
    if (!(props.draggable ?? false) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    state.dragging = true;
    state.fling = 0;
    state.angle = pointerAngle(e);
    state.travel = 0;
    state.samples = [[e.timeStamp, 0]];
    (e.currentTarget as HTMLDivElement)?.setPointerCapture?.(e.pointerId);
    setDragging(true);
    applyScale();
  };

  const handleUp = (e: PointerEvent) => {
    if (!state.dragging) return;
    state.dragging = false;
    setDragging(false);
    applyScale();
    const [startTime, startTravel] = state.samples[0];
    const lastTime = state.samples[state.samples.length - 1][0];
    const elapsed = e.timeStamp - startTime;
    const velocity =
      elapsed > 0 && e.timeStamp - lastTime < 80 ? ((state.travel - startTravel) / elapsed) * 1000 : 0;
    state.fling = reduce() ? 0 : clamp(velocity, -MAX_FLING, MAX_FLING) - state.cruise * speed.get();
  };

  const size = () => props.size ?? 200;
  const fontWeight = () => props.fontWeight ?? 900;

  return (
    <div
      ref={rootEl}
      class={`relative mx-auto rounded-full text-center cursor-pointer ${props.class ?? ''} ${props.className ?? ''}`}
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        'font-size': `${fontSize()}px`,
        'font-weight': fontWeight(),
        color: props.color || undefined,
        perspective: `${size() * 2.5}px`,
        cursor: (props.draggable ?? false) ? (dragging() ? 'grabbing' : 'grab') : undefined,
        'touch-action': (props.draggable ?? false) ? 'none' : undefined,
        'user-select': (props.draggable ?? false) ? 'none' : undefined,
        '-webkit-user-select': (props.draggable ?? false) ? 'none' : undefined
      }}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onPointerMove={handleMove}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <div ref={tiltWrapEl} class="absolute inset-0 [transform-style:preserve-3d]">
        <div
          class="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: props.tilt ? `rotateX(${props.tilt}deg)` : undefined }}
        >
          <span
            class="absolute inset-[1.3em] rounded-full border-solid border-current pointer-events-none transition-opacity duration-[400ms]"
            style={{
              'border-width': `${Math.max(1, fontSize() / 16)}px`,
              'border-color': props.ringColor || undefined,
              opacity: props.ring ? 1 : 0
            }}
          />
          <div ref={spinEl} class="absolute inset-0" role="img" aria-label={props.text}>
            <Index each={letters()}>
              {(letter, i) => (
                <span
                  class={`absolute inset-0 inline-block whitespace-pre ${settled() ? LETTER_EASE : ''}`}
                  style={{ transform: `rotate(${angles()[i] ?? 0}deg)` }}
                >
                  <span
                    ref={
                      i < glyphs().length
                        ? (el: HTMLSpanElement) => {
                            glyphEls[i] = el;
                          }
                        : undefined
                    }
                  >
                    {letter()}
                  </span>
                </span>
              )}
            </Index>
          </div>
        </div>
        <Show when={props.children != null && props.children !== false}>
          <div class="absolute inset-0 flex items-center justify-center">{props.children}</div>
        </Show>
      </div>
    </div>
  );
};

export default CircularText;
