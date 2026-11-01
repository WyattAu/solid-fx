import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { animate, motionValue } from 'motion';
import HugeiconsIcon, { type IconSvgObject } from '@/lib/HugeiconsIcon';
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';
import {
  ArrowDown01Icon,
  Attachment01Icon,
  Calendar03Icon,
  Cancel01Icon,
  ChartLineData01Icon,
  File02Icon,
  Globe02Icon,
  HelpCircleIcon,
  Mail01Icon,
  Mic01Icon,
  PlusSignIcon,
  SparklesIcon,
  Tick02Icon
} from '@hugeicons/core-free-icons';

export interface PromptBarSource {
  key: string;
  name: string;
  description?: string;
  icon?: JSX.Element | IconSvgObject;
  attach?: boolean;
}

export interface PromptBarCommand {
  key: string;
  name: string;
  description?: string;
}

export interface PromptBarModel {
  key: string;
  name: string;
  tag?: string;
}

export interface PromptBarSendDetail {
  attachments: string[];
  model?: PromptBarModel;
  effort?: string;
}

export interface PromptBarProps {
  placeholder?: string;
  sources?: PromptBarSource[];
  commands?: PromptBarCommand[];
  models?: PromptBarModel[];
  defaultModel?: string;
  efforts?: string[];
  defaultEffort?: string;
  onEffortChange?: (effort: string) => void;
  busy?: boolean;
  onSend?: (text: string, detail: PromptBarSendDetail) => void;
  onStop?: () => void;
  onAttach?: () => string | string[] | void | Promise<string | string[] | void>;
  onDictate?: () => string | void | Promise<string | void>;
  background?: string;
  color?: string;
  menuBackground?: string;
  sparkColor?: string;
  sparkBoost?: number;
  width?: number;
  radius?: number;
  maxRows?: number;
  morphDuration?: number;
  squash?: number;
  tilt?: number;
  pressScale?: number;
  className?: string;
  class?: string;
}

type Row = {
  key: string;
  name: string;
  description?: string;
  tag?: string;
  icon?: JSX.Element | IconSvgObject;
  attach?: boolean;
};
type Token = { kind: 'at' | 'slash'; query: string; start: number };
type Spark = {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
  life: number;
  span: number;
};

interface SendGlyphProps {
  busy: boolean;
  morphDuration: number;
  squash: number;
  tilt: number;
}

const ARROW_UP = [12, 4.5, 18.5, 11, 14.25, 11, 14.25, 19.5, 9.75, 19.5, 9.75, 11, 5.5, 11];
const SQUARE = [12, 6, 18, 6, 18, 12, 18, 18, 6, 18, 6, 12, 6, 6];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const LINE = 22;
const EDGE = 11;

const DEFAULT_SOURCES: PromptBarSource[] = [
  {
    key: 'files',
    name: 'Photos & files',
    description: 'Upload from this device',
    icon: Attachment01Icon,
    attach: true
  },
  { key: 'web', name: 'Web search', description: 'Live results', icon: Globe02Icon },
  { key: 'sales', name: 'Sales data', description: 'Revenue and churn', icon: ChartLineData01Icon },
  { key: 'docs', name: 'Documents', description: 'Specs, notes, briefs', icon: File02Icon },
  { key: 'mail', name: 'Mail', description: 'Read and draft mail', icon: Mail01Icon },
  { key: 'calendar', name: 'Calendar', description: 'Events and availability', icon: Calendar03Icon }
];
const DEFAULT_COMMANDS: PromptBarCommand[] = [
  { key: 'summarize', name: '/summarize', description: 'Digest the thread so far' },
  { key: 'compare', name: '/compare', description: 'Two options side by side' },
  { key: 'draft', name: '/draft', description: 'Write a first version' },
  { key: 'explain', name: '/explain', description: 'A plain-language walkthrough' },
  { key: 'tasks', name: '/tasks', description: 'Turn this into a to-do list' }
];
const DEFAULT_MODELS: PromptBarModel[] = [
  { key: 'nova-3', name: 'Nova 3', tag: 'Flagship' },
  { key: 'nova-mini', name: 'Nova Mini', tag: 'Fast' },
  { key: 'nova-2', name: 'Nova 2', tag: 'Legacy' }
];
const DEFAULT_EFFORTS = ['Low', 'Medium', 'High', 'Extra', 'Max'];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const pathAt = (a: number[], b: number[], t: number) => {
  let d = '';
  for (let i = 0; i < a.length; i += 2) {
    d += `${i ? 'L' : 'M'}${mix(a[i], b[i], t).toFixed(2)} ${mix(a[i + 1], b[i + 1], t).toFixed(2)}`;
  }
  return `${d}Z`;
};

const parseToken = (draft: string): Token | null => {
  const m = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!m) return null;
  return { kind: m[2] === '@' ? 'at' : 'slash', query: m[3].toLowerCase(), start: m.index + m[1].length };
};

// Upstream used React's isValidElement; hugeicons icon data is a tuple array,
// so the array shape is the discriminator here.
const isIconData = (icon: unknown): icon is IconSvgObject =>
  Array.isArray(icon) && (icon.length === 0 || Array.isArray(icon[0]));

const renderIcon = (icon: JSX.Element | IconSvgObject | undefined, size: number) =>
  icon === undefined ? null : isIconData(icon) ? (
    <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} />
  ) : (
    icon
  );

function SendGlyph(props: SendGlyphProps) {
  const reduce = usePrefersReducedMotion();
  const t = motionValue(props.busy ? 1 : 0);
  let dir = props.busy ? 1 : -1;
  let svgEl!: SVGSVGElement;
  let pathEl!: SVGPathElement;

  createEffect(() => {
    const busy = props.busy;
    const morphDuration = props.morphDuration;
    const reduced = reduce();
    dir = busy ? 1 : -1;
    const target = busy ? 1 : 0;
    if (t.get() === target) return;
    const controls = animate(t, target, reduced ? { duration: 0 } : { duration: morphDuration / 1000, ease: EASE_IN_OUT });
    onCleanup(() => controls.stop());
  });

  onMount(() => {
    const write = (v: number) => {
      pathEl?.setAttribute('d', pathAt(ARROW_UP, SQUARE, v));
      const goo = reduce() ? 0 : Math.sin(v * Math.PI);
      const sx = 1 - props.squash * goo;
      if (svgEl) {
        svgEl.style.transform = goo ? `rotate(${dir * props.tilt * goo}deg) scale(${sx}, ${1 / sx})` : '';
      }
    };
    const off = t.on('change', write);
    onCleanup(() => {
      off();
      t.stop();
    });
  });

  return (
    <svg
      ref={svgEl}
      class="block h-4 w-4 origin-center"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    >
      <path ref={pathEl} d={pathAt(ARROW_UP, SQUARE, t.get())} />
    </svg>
  );
}

const STYLE = `
@keyframes prompt-bar-pop { from { opacity: 0; transform: translateY(4px) scale(0.98); } }
@keyframes prompt-bar-eq { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
`;

const PromptBar = (props: PromptBarProps) => {
  const reduce = usePrefersReducedMotion();
  let rootEl!: HTMLDivElement;
  let inputEl!: HTMLTextAreaElement;
  let glowEl!: HTMLSpanElement;
  let sparkEl!: HTMLCanvasElement;
  const typing = { energy: 0, strokes: 0 };
  let rowRefs: (HTMLButtonElement | null)[] = [];
  let lastOpen: string | null = null;
  let dictation = 0;

  const sources = () => props.sources ?? DEFAULT_SOURCES;
  const commands = () => props.commands ?? DEFAULT_COMMANDS;
  const models = () => props.models ?? DEFAULT_MODELS;
  const efforts = () => props.efforts ?? DEFAULT_EFFORTS;

  const [draft, setDraft] = createSignal('');
  const [attachments, setAttachments] = createSignal<string[]>([]);
  const [modelKey, setModelKey] = createSignal(props.defaultModel ?? '');
  const [plusOpen, setPlusOpen] = createSignal(false);
  const [modelOpen, setModelOpen] = createSignal(false);
  const [effortOpen, setEffortOpen] = createSignal(false);
  const initEffort = () => {
    const list = props.efforts ?? DEFAULT_EFFORTS;
    const i = list.indexOf(props.defaultEffort ?? '');
    return i >= 0 ? i : Math.max(0, Math.floor((list.length - 1) / 2));
  };
  const [effortIndex, setEffortIndex] = createSignal(initEffort());
  const [dismissed, setDismissed] = createSignal(false);
  const [active, setActive] = createSignal(0);
  const [listening, setListening] = createSignal(false);
  const [pressed, setPressed] = createSignal(false);

  const model = createMemo(() => models().find(m => m.key === modelKey()) ?? models()[0]);
  const token = createMemo(() => (dismissed() ? null : parseToken(draft())));
  const open = (): 'at' | 'slash' | 'model' | 'effort' | null =>
    plusOpen() ? 'at' : (token()?.kind ?? (modelOpen() ? 'model' : effortOpen() ? 'effort' : null));
  const query = () => (plusOpen() ? '' : (token()?.query ?? ''));
  const list = createMemo<Row[]>(() => {
    const o = open();
    const q = query();
    if (o === 'at') return sources().filter(s => s.name.toLowerCase().includes(q));
    if (o === 'slash') return commands().filter(c => c.name.replace(/^\//, '').toLowerCase().startsWith(q));
    if (o === 'model') return models();
    return [];
  });
  const cursor = () => Math.min(active(), Math.max(0, list().length - 1));
  const canSend = () => draft().trim().length > 0 || attachments().length > 0;
  const busy = () => props.busy ?? false;
  const armed = () => busy() || canSend();
  const level = () => efforts()[effortIndex()] ?? '';
  const maxed = () => efforts().length > 1 && effortIndex() === efforts().length - 1;

  const focusInput = () => inputEl?.focus({ preventScroll: true });
  const closeMenus = () => {
    setPlusOpen(false);
    setModelOpen(false);
    setEffortOpen(false);
  };

  // Upstream useLayoutEffect on [open, cursor, list]: position the glow row.
  createEffect(() => {
    const o = open();
    const cur = cursor();
    void list();
    const glow = glowEl;
    if (!glow || !o) return;
    const row = rowRefs[cur];
    if (!row) {
      glow.style.opacity = '0';
      return;
    }
    const fresh = lastOpen !== o;
    lastOpen = o;
    if (fresh) glow.style.transition = 'none';
    glow.style.top = `${row.offsetTop}px`;
    glow.style.height = `${row.offsetHeight}px`;
    glow.style.opacity = '1';
    if (fresh) {
      void glow.offsetHeight;
      glow.style.transition = '';
    }
  });
  createEffect(() => {
    if (!open()) lastOpen = null;
  });

  createEffect(() => {
    if (!plusOpen() && !modelOpen() && !effortOpen()) return;
    const onDown = (e: PointerEvent) => {
      if (!rootEl?.contains(e.target as Node)) closeMenus();
    };
    document.addEventListener('pointerdown', onDown);
    onCleanup(() => document.removeEventListener('pointerdown', onDown));
  });

  createEffect(() => {
    void draft();
    const maxRows = props.maxRows ?? 5;
    const el = inputEl;
    if (!el) return;
    el.style.height = '0px';
    const max = LINE * maxRows;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  });

  onMount(() => {
    onCleanup(() => {
      dictation += 1;
    });
  });

  createEffect(() => {
    const canvas = sparkEl;
    if (!(maxed() && !reduce()) || !canvas) return;
    const sparkColor = props.sparkColor ?? '#b39dff';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    typing.strokes = 0;
    let raf = 0;
    let last = performance.now();
    let w = 0;
    let h = 0;
    let due = 0;
    let speed = 1;
    let pulse = 0;
    const parts: Spark[] = [];
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (burst: boolean) => {
      parts.push({
        x: Math.random() * w,
        y: burst ? h * (0.2 + Math.random() * 0.8) : h + 3,
        r: 0.9 + Math.random() * 1.1,
        vy: -(7 + Math.random() * 9),
        sway: (Math.random() - 0.5) * 10,
        phase: Math.random() * Math.PI * 2,
        life: burst ? Math.random() * 1.2 : 0,
        span: 2.4 + Math.random() * 2.4
      });
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const gain = props.sparkBoost ?? 1;
      typing.energy *= Math.exp(-dt / 0.8);
      pulse *= Math.exp(-dt / 0.16);
      if (typing.strokes > 0) {
        typing.strokes = 0;
        if (gain > 0) pulse = 1;
      }
      const energy = typing.energy * gain;
      speed += (1 + energy * 6 - speed) * (1 - Math.exp(-dt / 0.15));
      due += dt;
      while (due > 0.14) {
        due -= 0.14;
        if (parts.length < 30) spawn(false);
      }
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = sparkColor;
      ctx.shadowColor = sparkColor;
      ctx.shadowBlur = 6 + energy * 10 + pulse * 6;
      for (let i = parts.length - 1; i >= 0; i -= 1) {
        const p = parts[i];
        p.life += dt;
        if (p.life > p.span) {
          parts.splice(i, 1);
          continue;
        }
        const k = p.life / p.span;
        const twinkle = 0.7 + 0.3 * Math.sin((now / 160) * (1 + energy) + p.phase);
        p.y += p.vy * dt * speed;
        if (p.y < -4) {
          p.y = h + 3;
          p.x = Math.random() * w;
        }
        const edge = Math.min(1, Math.max(0, p.y / 14), Math.max(0, (h - p.y) / 14));
        ctx.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * (0.9 + energy * 0.25) * twinkle) * edge;
        ctx.beginPath();
        ctx.arc(
          p.x + Math.sin((now / 900) * (1 + energy * 0.8) + p.phase) * p.sway,
          p.y,
          p.r * twinkle * (1 + energy * 0.35),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    resize();
    for (let i = 0; i < 26; i += 1) spawn(true);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    raf = requestAnimationFrame(tick);
    onCleanup(() => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctx.clearRect(0, 0, w, h);
    });
  });

  const setEffort = (i: number) => {
    const next = Math.max(0, Math.min(efforts().length - 1, i));
    if (next === effortIndex()) return;
    setEffortIndex(next);
    untrack(() => props.onEffortChange?.(efforts()[next]));
  };
  const effortFromPointer = (e: PointerEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const k = (e.clientX - rect.left - EDGE) / Math.max(1, rect.width - 2 * EDGE);
    setEffort(Math.round(k * (efforts().length - 1)));
  };
  const onEffortKey = (e: KeyboardEvent) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (step) {
      e.preventDefault();
      setEffort(effortIndex() + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setEffort(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setEffort(efforts().length - 1);
    } else if (e.key === 'Escape') {
      setEffortOpen(false);
      focusInput();
    }
  };
  const stepAt = (i: number) =>
    `calc(${EDGE}px + (100% - ${EDGE * 2}px) * ${i / Math.max(1, efforts().length - 1)})`;
  const fillAt = (i: number) => (i === efforts().length - 1 ? '100%' : `calc(${stepAt(i)} + 7px)`);

  const pick = (row: Row) => {
    if (open() === 'model') {
      setModelKey(row.key);
      setModelOpen(false);
      focusInput();
      return;
    }
    const tokenNow = token();
    const head = tokenNow ? draft().slice(0, tokenNow.start) : draft();
    if (row.attach) {
      setDraft(head);
      Promise.resolve(untrack(() => props.onAttach?.())).then(files => {
        if (!files) return;
        setAttachments(a => [...a, ...(Array.isArray(files) ? files : [files])]);
      });
    } else if (open() === 'at') {
      setDraft(`${head}@${row.name} `);
    } else {
      setDraft(`${head}${row.name} `);
    }
    setPlusOpen(false);
    setDismissed(false);
    focusInput();
  };

  const send = () => {
    if (!canSend() || busy()) return;
    untrack(() =>
      props.onSend?.(draft().trim(), { attachments: attachments(), model: model(), effort: level() })
    );
    setDraft('');
    setAttachments([]);
    setDismissed(false);
    closeMenus();
    focusInput();
  };

  const toggleListen = () => {
    if (listening()) {
      dictation += 1;
      setListening(false);
      return;
    }
    const seq = ++dictation;
    setListening(true);
    Promise.resolve(untrack(() => props.onDictate?.())).then(
      text => {
        if (seq !== dictation) return;
        setListening(false);
        if (text) setDraft(d => (d.trim() ? `${d.trimEnd()} ${text}` : text));
        focusInput();
      },
      () => {
        if (seq === dictation) setListening(false);
      }
    );
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (open() && list().length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((cursor() + (e.key === 'ArrowDown' ? 1 : list().length - 1)) % list().length);
        return;
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault();
        pick(list()[cursor()]);
        return;
      }
    }
    if (e.key === 'Escape') {
      if (open()) {
        e.preventDefault();
        setDismissed(true);
        closeMenus();
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const down = (e: PointerEvent) => {
    if (e.button !== 0 || !armed()) return;
    setPressed(true);
  };
  const up = () => setPressed(false);

  return (
    <div
      ref={rootEl}
      class={`group relative text-[14px] leading-[22px] [width:min(var(--pb-w),100%)] [color:var(--pb-ink)]${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      data-busy={busy() ? '' : undefined}
      data-max={maxed() ? '' : undefined}
      style={{
        '--pb-bg': props.background ?? '#27272a',
        '--pb-ink': props.color ?? '#f5f5f5',
        '--pb-menu': props.menuBackground ?? '#323236',
        '--pb-w': `${props.width ?? 400}px`,
        '--pb-radius': `${props.radius ?? 16}px`,
        '--pb-spark': props.sparkColor ?? '#b39dff',
        '--pb-press': props.pressScale ?? 0.96
      }}
    >
      <style>{STYLE}</style>
      {open() ? (
        <div
          class="absolute inset-x-0 bottom-[calc(100%+8px)] z-[2] origin-bottom rounded-xl p-1 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.08)] [animation:prompt-bar-pop_180ms_cubic-bezier(0.23,1,0.32,1)_both] [background:var(--pb-menu)] data-[kind=model]:right-auto data-[kind=model]:w-[200px] data-[kind=model]:origin-bottom-left data-[kind=effort]:right-auto data-[kind=effort]:w-[248px] data-[kind=effort]:origin-bottom-left data-[kind=effort]:px-3.5 data-[kind=effort]:pt-3 data-[kind=effort]:pb-3.5 motion-reduce:[animation:none]"
          role={open() === 'effort' ? 'dialog' : 'listbox'}
          aria-label={
            open() === 'at' ? 'Sources' : open() === 'slash' ? 'Commands' : open() === 'model' ? 'Models' : 'Effort'
          }
          data-kind={open()}
        >
          {open() === 'effort' ? (
            <>
              <div class="flex items-center gap-2 text-[13px] leading-[18px]">
                <span class="[color:color-mix(in_srgb,var(--pb-ink)_55%,transparent)]">Effort</span>
                <span class="font-medium">{level()}</span>
                <span
                  class="ml-auto inline-flex [color:color-mix(in_srgb,var(--pb-ink)_55%,transparent)]"
                  title="Higher effort thinks longer before answering"
                >
                  <HugeiconsIcon icon={HelpCircleIcon} size={14} strokeWidth={1.8} />
                </span>
              </div>
              <div class="mt-3 flex justify-between text-[12px] leading-4 [color:color-mix(in_srgb,var(--pb-ink)_55%,transparent)]">
                <span>Faster</span>
                <span>Smarter</span>
              </div>
              <div
                class="relative mt-2 h-[22px] cursor-pointer touch-none rounded-[11px] outline-none select-none [background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)]"
                role="slider"
                tabIndex={0}
                aria-label="Effort"
                aria-valuemin={0}
                aria-valuemax={efforts().length - 1}
                aria-valuenow={effortIndex()}
                aria-valuetext={level()}
                style={{ '--pb-effort-x': stepAt(effortIndex()), '--pb-effort-fill': fillAt(effortIndex()) }}
                onPointerDown={e => {
                  if (e.button !== 0) return;
                  const el = e.currentTarget as HTMLDivElement;
                  try {
                    el.setPointerCapture(e.pointerId);
                  } catch {}
                  el.focus({ preventScroll: true });
                  effortFromPointer(e);
                }}
                onPointerMove={e => {
                  if (e.buttons & 1) effortFromPointer(e);
                }}
                onKeyDown={onEffortKey}
              >
                <span class="absolute inset-y-0 left-0 rounded-[11px] [width:var(--pb-effort-fill)] [background:color-mix(in_srgb,var(--pb-ink)_18%,transparent)] [transition:width_220ms_cubic-bezier(0.23,1,0.32,1),background-color_300ms_ease] group-data-[max]:[background:color-mix(in_srgb,var(--pb-spark)_35%,transparent)] motion-reduce:[transition:background-color_300ms_ease]" />
                <For each={efforts()}>
                  {label => (
                    <i
                      class="absolute top-1/2 -mt-0.5 -ml-0.5 h-1 w-1 rounded-full [background:color-mix(in_srgb,var(--pb-ink)_30%,transparent)]"
                      style={{ left: stepAt(efforts().indexOf(label)) }}
                    />
                  )}
                </For>
                <span class="absolute -top-[3px] -ml-[7px] h-7 w-3.5 rounded-[7px] shadow-[0_2px_6px_rgba(0,0,0,0.25)] [left:var(--pb-effort-x)] [background:var(--pb-ink)] [transition:left_220ms_cubic-bezier(0.23,1,0.32,1),background-color_300ms_ease] group-data-[max]:[background:var(--pb-spark)] motion-reduce:[transition:background-color_300ms_ease]" />
              </div>
            </>
          ) : (
            <>
              <span
                ref={glowEl}
                class="pointer-events-none absolute inset-x-1 rounded-lg opacity-0 [background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] [transition:top_220ms_cubic-bezier(0.23,1,0.32,1),height_220ms_cubic-bezier(0.23,1,0.32,1),opacity_150ms_ease] motion-reduce:[transition:opacity_150ms_ease]"
                aria-hidden="true"
              />
              <For each={list()}>
                {(row, i) => (
                  <button
                    ref={el => {
                      rowRefs[i()] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={i() === cursor()}
                    class="relative z-[1] flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-2 text-left text-inherit outline-none [font:inherit] [-webkit-tap-highlight-color:transparent]"
                    onMouseDown={e => e.preventDefault()}
                    onPointerEnter={() => setActive(i())}
                    onClick={() => pick(row)}
                  >
                    {open() === 'at' ? (
                      <span class="inline-flex w-5 flex-none justify-center [color:color-mix(in_srgb,var(--pb-ink)_70%,transparent)]">
                        {renderIcon(row.icon, 15)}
                      </span>
                    ) : null}
                    <span class="flex-none text-[13px] font-medium">{row.name}</span>
                    {row.description ? (
                      <span class="min-w-0 flex-auto truncate text-[12px] [color:color-mix(in_srgb,var(--pb-ink)_55%,transparent)]">
                        {row.description}
                      </span>
                    ) : null}
                    {open() === 'model' ? (
                      <>
                        <span class="ml-auto flex-none text-[11px] [color:color-mix(in_srgb,var(--pb-ink)_55%,transparent)]">
                          {row.tag}
                        </span>
                        <span
                          class="inline-flex w-4 flex-none justify-center opacity-0 data-[on]:opacity-100"
                          data-on={row.key === model()?.key ? '' : undefined}
                        >
                          <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />
                        </span>
                      </>
                    ) : null}
                  </button>
                )}
              </For>
              {list().length === 0 ? (
                <div class="flex h-9 items-center px-2 text-[12px] [color:color-mix(in_srgb,var(--pb-ink)_55%,transparent)]">
                  No matches for “{query()}”
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div
        class="relative isolate flex cursor-text flex-col gap-2 p-3 [background:var(--pb-bg)] [border-radius:var(--pb-radius)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:opacity-0 before:content-[''] before:[background:radial-gradient(140%_120%_at_0%_100%,color-mix(in_srgb,var(--pb-spark)_26%,transparent),transparent_62%)] before:[transition:opacity_500ms_ease] data-[max]:before:opacity-100"
        role="presentation"
        data-max={maxed() ? '' : undefined}
        onPointerDown={e => {
          if (e.target === (e.currentTarget as HTMLDivElement) || e.target === inputEl) closeMenus();
        }}
        onClick={focusInput}
      >
        <canvas
          ref={sparkEl}
          class="pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-[inherit]"
          aria-hidden="true"
        />
        {attachments().length > 0 ? (
          <div class="flex flex-wrap gap-1.5">
            <For each={attachments()}>
              {(file, i) => (
                <span class="inline-flex h-[26px] items-center gap-1.5 rounded-lg pr-1 pl-2 text-[12px] [animation:prompt-bar-pop_200ms_cubic-bezier(0.23,1,0.32,1)_both] [background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] motion-reduce:[animation:none]">
                  <HugeiconsIcon icon={File02Icon} size={12} strokeWidth={2} />
                  <span class="max-w-[144px] truncate">{file}</span>
                  <button
                    type="button"
                    class="inline-grid h-[18px] w-[18px] cursor-pointer place-items-center rounded-[5px] border-0 bg-transparent p-0 text-inherit opacity-60 outline-none [transition:opacity_120ms_ease,background-color_120ms_ease] hover:opacity-100 hover:[background:color-mix(in_srgb,var(--pb-ink)_10%,transparent)]"
                    aria-label={`Remove ${file}`}
                    onClick={() => setAttachments(a => a.filter((_, j) => j !== i()))}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={10} strokeWidth={2.5} />
                  </button>
                </span>
              )}
            </For>
          </div>
        ) : null}

        <textarea
          ref={inputEl}
          class="block w-full resize-none border-0 bg-transparent p-0 text-[14px] leading-[22px] text-inherit outline-none [font:inherit] [overflow-wrap:anywhere] placeholder:[color:color-mix(in_srgb,var(--pb-ink)_45%,transparent)] [@media(pointer:coarse)]:text-[16px]"
          rows={1}
          value={draft()}
          placeholder={listening() ? 'Listening…' : (props.placeholder ?? 'Ask anything')}
          aria-label="Prompt"
          onInput={e => {
            setDraft((e.currentTarget as HTMLTextAreaElement).value);
            typing.energy = Math.min(1.6, typing.energy + 0.22);
            typing.strokes = Math.min(4, typing.strokes + 1);
            setDismissed(false);
            closeMenus();
            setActive(0);
          }}
          onFocus={closeMenus}
          onKeyDown={onKeyDown}
        />

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="inline-grid h-7 w-7 flex-none cursor-pointer touch-manipulation place-items-center rounded-lg border-0 bg-transparent p-0 outline-none select-none [color:color-mix(in_srgb,var(--pb-ink)_60%,transparent)] [font:inherit] [-webkit-tap-highlight-color:transparent] [transition:background-color_150ms_ease,color_150ms_ease,transform_160ms_cubic-bezier(0.23,1,0.32,1)] active:[transform:scale(0.94)] data-[on]:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] data-[on]:[color:var(--pb-ink)] motion-reduce:active:[transform:none] [@media(hover:hover)_and_(pointer:fine)]:hover:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] [@media(hover:hover)_and_(pointer:fine)]:hover:[color:var(--pb-ink)]"
            aria-label="Add files and sources"
            aria-expanded={plusOpen()}
            data-on={plusOpen() ? '' : undefined}
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              setModelOpen(false);
              setEffortOpen(false);
              setActive(0);
              setPlusOpen(v => !v);
              focusInput();
            }}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
          </button>
          {models().length > 0 ? (
            <button
              type="button"
              class="inline-flex h-7 flex-none cursor-pointer touch-manipulation items-center gap-1 rounded-lg border-0 bg-transparent px-2 text-[12px] font-medium outline-none select-none [color:color-mix(in_srgb,var(--pb-ink)_70%,transparent)] [font:inherit] [-webkit-tap-highlight-color:transparent] [transition:background-color_150ms_ease,color_150ms_ease] data-[on]:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] data-[on]:[color:var(--pb-ink)] [@media(hover:hover)_and_(pointer:fine)]:hover:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] [@media(hover:hover)_and_(pointer:fine)]:hover:[color:var(--pb-ink)] data-[max]:[color:var(--pb-spark)]! "
              aria-label="Choose model"
              aria-expanded={modelOpen()}
              data-on={modelOpen() ? '' : undefined}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                setPlusOpen(false);
                setEffortOpen(false);
                setActive(Math.max(0, models().indexOf(model() as PromptBarModel)));
                setModelOpen(v => !v);
                focusInput();
              }}
            >
              <span>{model()?.name}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={12} strokeWidth={2.4} />
            </button>
          ) : null}
          {efforts().length > 0 ? (
            <button
              type="button"
              class="inline-flex h-7 flex-none cursor-pointer touch-manipulation items-center gap-1 rounded-lg border-0 bg-transparent px-2 text-[12px] font-medium outline-none select-none [color:color-mix(in_srgb,var(--pb-ink)_70%,transparent)] [font:inherit] [-webkit-tap-highlight-color:transparent] [transition:background-color_150ms_ease,color_150ms_ease] data-[on]:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] data-[on]:[color:var(--pb-ink)] [@media(hover:hover)_and_(pointer:fine)]:hover:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] [@media(hover:hover)_and_(pointer:fine)]:hover:[color:var(--pb-ink)] data-[max]:[color:var(--pb-spark)]! "
              aria-label="Choose effort"
              aria-expanded={effortOpen()}
              data-on={effortOpen() ? '' : undefined}
              data-max={maxed() ? '' : undefined}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                setPlusOpen(false);
                setModelOpen(false);
                setEffortOpen(v => !v);
                focusInput();
              }}
            >
              <HugeiconsIcon icon={SparklesIcon} size={13} strokeWidth={2} />
              <span>{level()}</span>
            </button>
          ) : null}
          <span class="flex-auto" />
          {props.onDictate ? (
            <button
              type="button"
              class="inline-grid h-7 w-7 flex-none cursor-pointer touch-manipulation place-items-center rounded-lg border-0 bg-transparent p-0 outline-none select-none [color:color-mix(in_srgb,var(--pb-ink)_60%,transparent)] [font:inherit] [-webkit-tap-highlight-color:transparent] [transition:background-color_150ms_ease,color_150ms_ease,transform_160ms_cubic-bezier(0.23,1,0.32,1)] active:[transform:scale(0.94)] data-[on]:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] data-[on]:[color:var(--pb-ink)] motion-reduce:active:[transform:none] [@media(hover:hover)_and_(pointer:fine)]:hover:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] [@media(hover:hover)_and_(pointer:fine)]:hover:[color:var(--pb-ink)]"
              aria-label={listening() ? 'Stop dictation' : 'Dictate'}
              aria-pressed={listening()}
              data-on={listening() ? '' : undefined}
              onMouseDown={e => e.preventDefault()}
              onClick={toggleListen}
            >
              {listening() ? (
                <span
                  class="flex h-3.5 items-center gap-[2.5px] [&>i]:block [&>i]:h-full [&>i]:w-[2.5px] [&>i]:origin-center [&>i]:rounded-full [&>i]:bg-current [&>i]:[animation:prompt-bar-eq_900ms_ease-in-out_infinite] [&>i:nth-child(2)]:[animation-delay:150ms] [&>i:nth-child(3)]:[animation-delay:300ms]"
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <HugeiconsIcon icon={Mic01Icon} size={15} strokeWidth={2} />
              )}
            </button>
          ) : null}
          <button
            type="button"
            class="relative inline-grid h-7 w-7 flex-none cursor-pointer touch-manipulation place-items-center rounded-lg border-0 p-0 outline-none select-none [background:color-mix(in_srgb,var(--pb-ink)_12%,var(--pb-bg))] [color:color-mix(in_srgb,var(--pb-ink)_55%,var(--pb-bg))] [font:inherit] [-webkit-tap-highlight-color:transparent] [transition:background-color_200ms_ease,color_200ms_ease,transform_160ms_cubic-bezier(0.23,1,0.32,1)] disabled:cursor-default data-[armed]:[background:var(--pb-ink)] data-[armed]:[color:var(--pb-bg)] data-[pressed]:[transform:scale(var(--pb-press))] motion-reduce:data-[pressed]:[transform:none]"
            disabled={!armed()}
            aria-label={busy() ? 'Stop' : 'Send'}
            data-armed={armed() ? '' : undefined}
            data-pressed={pressed() ? '' : undefined}
            onMouseDown={e => e.preventDefault()}
            onPointerDown={down}
            onPointerUp={up}
            onPointerCancel={up}
            onPointerLeave={up}
            onClick={() => {
              if (busy()) untrack(() => props.onStop?.());
              else send();
            }}
          >
            <SendGlyph
              busy={busy()}
              morphDuration={props.morphDuration ?? 240}
              squash={props.squash ?? 0.12}
              tilt={props.tilt ?? 8}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptBar;
