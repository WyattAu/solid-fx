import { createEffect, createSignal, onCleanup, onMount, Index } from 'solid-js';

type Side = 'left' | 'right';

export interface OptionWheelProps {
  items?: string[];
  defaultSelected?: number;
  onChange?: (index: number, item: string) => void;
  textColor?: string;
  activeColor?: string;
  side?: Side;
  fontSize?: number;
  spacing?: number;
  curve?: number;
  tilt?: number;
  blur?: number;
  fade?: number;
  minOpacity?: number;
  smoothing?: number;
  inset?: number;
  loop?: boolean;
  draggable?: boolean;
  soundUrl?: string;
  soundVolume?: number;
  className?: string;
  class?: string;
}

interface WheelConfig {
  count: number;
  items: string[];
  rowH: number;
  curve: number;
  tilt: number;
  blur: number;
  fade: number;
  minOpacity: number;
  side: Side;
  loop: boolean;
  smoothing: number;
  draggable: boolean;
  soundUrl: string;
  soundVolume: number;
}

const DEFAULT_ITEMS = [
  'Ambient',
  'House',
  'Techno',
  'Jazz',
  'Lo-Fi',
  'Synthwave',
  'Trance',
  'Funk',
  'Disco',
  'Hip-Hop',
  'Chillwave',
  'Drum & Bass'
];

const OptionWheel = (props: OptionWheelProps) => {
  let root!: HTMLDivElement;
  const itemRefs: (HTMLDivElement | null)[] = [];
  let pos = props.defaultSelected ?? 3;
  let target = props.defaultSelected ?? 3;
  let raf: number | null = null;
  let last = 0;
  let cfgNow: WheelConfig = {} as WheelConfig;
  let selected = props.defaultSelected ?? 3;
  let wheelTimer: ReturnType<typeof setTimeout> | null = null;
  let drag: { y: number; start: number; id: number } | null = null;
  let dragMoved = false;
  let audio: HTMLAudioElement | null = null;
  let audioUrl = '';
  let lastTick = 0;
  const [selectedIndex, setSelectedIndex] = createSignal(props.defaultSelected ?? 3);
  const [isDragging, setIsDragging] = createSignal(false);

  const items = () => props.items ?? DEFAULT_ITEMS;

  const remPx =
    typeof window !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16;

  // Single rAF loop that eases the wheel position toward its target with
  // frame-rate independent exponential smoothing, then lays every option out
  // along the curve based on its distance from the current position.
  const runFrame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const cfg = cfgNow;
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    const cur = pos;
    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    pos = next;

    const n = cfg.count;
    const mirror = cfg.side === 'right' ? -1 : 1;
    // Options sit on a circle whose radius keeps the arc length between two
    // neighbors equal to one row height, so tilt controls how tightly it curls.
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    for (let i = 0; i < n; i++) {
      const el = itemRefs[i];
      if (!el) continue;
      let d = i - next;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * cfg.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
      el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : 'none';
      el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }

    raf = settled ? null : requestAnimationFrame(runFrame);
  };

  const startLoop = () => {
    if (raf != null) {
      cancelAnimationFrame(raf);
    }
    last = performance.now();
    raf = requestAnimationFrame(runFrame);
  };

  // Optional tick on selection change, throttled so fast scrolling can't spam
  // it, and with playback failures (e.g. autoplay policies) silently ignored.
  const playTick = () => {
    const { soundUrl, soundVolume } = cfgNow;
    if (!soundUrl) return;
    const now = performance.now();
    if (now - lastTick < 70) return;
    lastTick = now;
    if (!audio || audioUrl !== soundUrl) {
      audio = new Audio(soundUrl);
      audio.preload = 'auto';
      audioUrl = soundUrl;
    }
    audio.volume = Math.min(Math.max(soundVolume, 0), 1);
    audio.currentTime = 0;
    audio.play()?.catch(() => {});
  };

  const applyTarget = (value: number, snap: boolean) => {
    const cfg = cfgNow;
    let v = value;
    if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
    if (snap) v = Math.round(v);
    target = v;
    const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
    if (idx !== selected) {
      selected = idx;
      setSelectedIndex(idx);
      props.onChange?.(idx, cfg.items[idx]);
      playTick();
    }
    startLoop();
  };

  // Upstream assigned cfgRef.current on every render, then re-applied the
  // target in a layout effect keyed on the layout props; one tracking effect
  // reproduces both.
  createEffect(() => {
    cfgNow = {
      count: items().length,
      items: items(),
      rowH: Math.max((props.fontSize ?? 3) * (props.spacing ?? 1.4) * remPx, 1),
      curve: props.curve ?? 1,
      tilt: props.tilt ?? 6,
      blur: props.blur ?? 2,
      fade: props.fade ?? 0.25,
      minOpacity: props.minOpacity ?? 0.05,
      side: props.side ?? 'left',
      loop: props.loop ?? false,
      smoothing: props.smoothing ?? 200,
      draggable: props.draggable ?? true,
      soundUrl: props.soundUrl ?? '',
      soundVolume: props.soundVolume ?? 0.5
    };
    applyTarget(target, false);
  });

  onMount(() => {
    // Wheel / touchpad scrolling, registered manually so it can be non-passive.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cfg = cfgNow;
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      // Cap each event at one step so notchy mouse wheels move exactly one
      // option per click, while touchpads still scroll continuously.
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
      applyTarget(target + step, false);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => applyTarget(target, true), 140);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    onCleanup(() => {
      root.removeEventListener('wheel', onWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    });
  });

  onCleanup(() => {
    if (raf != null) cancelAnimationFrame(raf);
    raf = null;
    audio?.pause();
  });

  const handlePointerDown = (e: PointerEvent) => {
    if (!cfgNow.draggable) return;
    drag = { y: e.clientY, start: target, id: e.pointerId };
    dragMoved = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const d = drag;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (!dragMoved && Math.abs(dy) > 4) {
      dragMoved = true;
      // Capture only once a real drag starts, so plain clicks still reach
      // the items and navigate to them.
      root.setPointerCapture(d.id);
    }
    if (dragMoved) applyTarget(d.start - dy / cfgNow.rowH, false);
  };

  const handlePointerEnd = () => {
    if (!drag) return;
    drag = null;
    setIsDragging(false);
    if (dragMoved) applyTarget(target, true);
  };

  const handleItemClick = (index: number) => {
    if (dragMoved) return;
    const cfg = cfgNow;
    const cur = target;
    let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
    if (cfg.loop && cfg.count > 1) {
      if (d > cfg.count / 2) d -= cfg.count;
      else if (d < -cfg.count / 2) d += cfg.count;
    }
    applyTarget(cur + d, true);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    let delta: number | null = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;
    if (delta == null) return;
    e.preventDefault();
    applyTarget(Math.round(target) + delta, true);
  };

  return (
    <div
      ref={root}
      role="listbox"
      tabIndex={0}
      aria-label="Option wheel"
      class={`relative h-full w-full select-none overflow-hidden outline-none [touch-action:none] ${isDragging() ? 'cursor-grabbing' : 'cursor-grab'}${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      style={{
        '--ow-text-color': props.textColor ?? '#a6a6a6',
        '--ow-active-color': props.activeColor ?? '#ffffff',
        '--ow-font-size': `${props.fontSize ?? 3}rem`,
        '--ow-inset': `${props.inset ?? 80}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      <Index each={items()}>
        {(label, index) => (
          <div
            ref={el => {
              itemRefs[index] = el;
            }}
            role="option"
            aria-selected={selectedIndex() === index}
            class={`absolute top-1/2 cursor-pointer whitespace-nowrap leading-none will-change-[transform,opacity,filter] [font-size:var(--ow-font-size)] [color:color-mix(in_srgb,var(--ow-active-color)_calc(var(--ow-p,0)*100%),var(--ow-text-color))] ${
              (props.side ?? 'left') === 'right' ? 'right-[var(--ow-inset)] origin-right' : 'left-[var(--ow-inset)] origin-left'
            } ${selectedIndex() === index ? 'font-medium' : 'font-extralight'}`}
            onClick={() => handleItemClick(index)}
          >
            {label()}
          </div>
        )}
      </Index>
    </div>
  );
};

export default OptionWheel;
