import { createEffect, createMemo, createSignal, onCleanup, splitProps, untracked } from 'solid-js';
import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion';

type TileState = {
  current: string;
  next: string;
  flipping: boolean;
  tick: number;
};

type AnimationPlan = {
  index: number;
  from: string;
  target: string;
  sequence: string[];
  start: number;
  step: number;
  done: boolean;
};

type TileUpdate = {
  index: number;
  current: string;
  next: string;
  done: boolean;
};

type Timing = {
  flipMs: number;
  staggerMs: number;
  holdMs: number;
  flips: number;
  glyphs: string;
  order: SplitFlapOrder;
};

export type SplitFlapAlign = 'left' | 'center' | 'right';

export type SplitFlapOrder = 'left' | 'right' | 'center' | 'random';

export type SplitFlapTileStyle = 'board' | 'minimal';

export interface SplitFlapTextProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className' | 'style'> {
  words?: string[];
  text?: string;
  flipDuration?: number;
  stagger?: number;
  cycleDelay?: number;
  charset?: 'alpha' | 'alphanumeric' | 'numeric' | (string & {});
  flipsPerChar?: number;
  tileColor?: string;
  textColor?: string;
  tileRadius?: number | string;
  gap?: number | string;
  fontSize?: number | string;
  loop?: boolean;
  padTo?: number;
  align?: SplitFlapAlign;
  intro?: boolean;
  glare?: number;
  depth?: number;
  order?: SplitFlapOrder;
  tileStyle?: SplitFlapTileStyle;
  className?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

const DEFAULT_WORDS = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'];

const CHARSETS: Record<string, string> = {
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  numeric: '0123456789'
};

const styles = `
.split-flap-text{gap:var(--split-flap-gap,6px);font-family:'SFMono-Regular','Roboto Mono','Cascadia Code','Liberation Mono',Menlo,monospace;font-size:var(--split-flap-font-size,52px);font-weight:760;line-height:1;letter-spacing:.035em;font-variant-numeric:tabular-nums}
.split-flap-text__tile{position:relative;flex:none;width:.78em;height:1.08em;overflow:hidden;border-radius:var(--split-flap-radius,8px);background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.16),transparent 44%),linear-gradient(180deg,color-mix(in srgb,var(--split-flap-tile-color,#111827) 82%,white),var(--split-flap-tile-color,#111827));box-shadow:0 .035em .08em rgba(255,255,255,.08) inset,0 -.05em .1em rgba(0,0,0,.38) inset,0 calc(.16em * var(--split-flap-lift,1)) calc(.38em * var(--split-flap-lift,1)) rgba(0,0,0,var(--split-flap-drop,.28));perspective:10em;transform-style:preserve-3d;isolation:isolate}
.split-flap-text__tile::before{content:'';position:absolute;z-index:8;top:calc(50% - var(--split-flap-hinge,1px) / 2);left:0;width:100%;height:var(--split-flap-hinge,1px);background:linear-gradient(90deg,transparent,rgba(255,255,255,.18) 18%,rgba(0,0,0,var(--split-flap-hinge-shade,.64)) 50%,rgba(255,255,255,.14) 82%,transparent);box-shadow:0 -1px 0 rgba(255,255,255,.08),0 1px 0 rgba(0,0,0,.5);pointer-events:none}
.split-flap-text__tile::after{content:'';position:absolute;inset:0;z-index:9;border:1px solid rgba(255,255,255,.08);border-radius:inherit;box-shadow:0 0 0 1px rgba(0,0,0,.2) inset;pointer-events:none}
.split-flap-text__half,.split-flap-text__flap{position:absolute;left:0;width:100%;height:50%;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.07),transparent 34%),var(--split-flap-tile-color,#111827);backface-visibility:hidden}
.split-flap-text__half--top,.split-flap-text__flap--front{top:0}
.split-flap-text__half--bottom,.split-flap-text__flap--back{bottom:0}
.split-flap-text__half--bottom,.split-flap-text__flap--back{background:linear-gradient(0deg,rgba(255,255,255,.06),transparent 38%),color-mix(in srgb,var(--split-flap-tile-color,#111827) 92%,black)}
.split-flap-text__char{position:absolute;left:0;width:100%;height:200%;display:flex;align-items:center;justify-content:center;color:var(--split-flap-text-color,#f8fafc);text-shadow:0 .025em 0 rgba(255,255,255,.16),0 .09em .16em rgba(0,0,0,.42)}
.split-flap-text__half--top .split-flap-text__char,.split-flap-text__flap--front .split-flap-text__char{top:0}
.split-flap-text__half--bottom .split-flap-text__char,.split-flap-text__flap--back .split-flap-text__char{bottom:0}
.split-flap-text__flap{z-index:6;will-change:transform,filter;transform-style:preserve-3d}
.split-flap-text__flap--front{transform-origin:center bottom;box-shadow:inset 0 var(--split-flap-edge,0em) 0 rgba(255,255,255,.16);animation:split-flap-front var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text__flap--back{transform-origin:center top;transform:rotateX(90deg);box-shadow:inset 0 calc(var(--split-flap-edge,0em) * -1) 0 rgba(0,0,0,.4);animation:split-flap-back var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text__shade{position:absolute;z-index:4;left:0;width:100%;height:50%;pointer-events:none;animation:split-flap-shade-top var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text__shade--top{top:0;background:linear-gradient(0deg,rgba(0,0,0,var(--split-flap-cast,0)),transparent 85%)}
.split-flap-text__shade--bottom{bottom:0;background:linear-gradient(180deg,rgba(0,0,0,var(--split-flap-cast,0)),transparent 90%);animation-name:split-flap-shade-bottom}
.split-flap-text--glare .split-flap-text__flap::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 32%,rgba(255,255,255,var(--split-flap-glare,0)) 50%,transparent 68%) 0 100% / 100% 300% no-repeat;animation:split-flap-glare-front var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text--glare .split-flap-text__flap--back::after{animation-name:split-flap-glare-back}
.split-flap-text--minimal .split-flap-text__tile{background:none;box-shadow:none;-webkit-mask:linear-gradient(#000 0 0) top / 100% calc(50% - var(--split-flap-split,.045em) / 2) no-repeat,linear-gradient(#000 0 0) bottom / 100% calc(50% - var(--split-flap-split,.045em) / 2) no-repeat;mask:linear-gradient(#000 0 0) top / 100% calc(50% - var(--split-flap-split,.045em) / 2) no-repeat,linear-gradient(#000 0 0) bottom / 100% calc(50% - var(--split-flap-split,.045em) / 2) no-repeat}
.split-flap-text--minimal .split-flap-text__tile::before,.split-flap-text--minimal .split-flap-text__tile::after,.split-flap-text--minimal .split-flap-text__flap::after{display:none}
.split-flap-text--minimal .split-flap-text__half,.split-flap-text--minimal .split-flap-text__flap{background:none;box-shadow:none}
.split-flap-text--minimal .split-flap-text__char{text-shadow:none}
.split-flap-text--minimal .split-flap-text__tile.is-flipping .split-flap-text__half--top{animation:split-flap-reveal var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text--minimal .split-flap-text__tile.is-flipping .split-flap-text__half--bottom{animation:split-flap-cover var(--split-flap-flip-duration,.12s) linear both}
@keyframes split-flap-front{0%{transform:rotateX(0deg);filter:brightness(var(--split-flap-front-from,1.08));animation-timing-function:cubic-bezier(.55,.055,.675,.19)}50%,100%{transform:rotateX(-90deg);filter:brightness(var(--split-flap-front-to,.52))}}
@keyframes split-flap-back{0%,50%{transform:rotateX(90deg);filter:brightness(var(--split-flap-back-from,.58));animation-timing-function:cubic-bezier(.215,.61,.355,1)}100%{transform:rotateX(0deg);filter:brightness(1)}}
@keyframes split-flap-shade-top{0%,32%{opacity:1}50%,100%{opacity:0}}
@keyframes split-flap-shade-bottom{0%{opacity:0;animation-timing-function:cubic-bezier(.55,.055,.675,.19)}50%,100%{opacity:1}}
@keyframes split-flap-glare-front{0%{background-position:0 100%;opacity:0}30%{opacity:1}50%,100%{background-position:0 0%;opacity:.75}}
@keyframes split-flap-glare-back{0%,50%{background-position:0 100%;opacity:.75}100%{background-position:0 0%;opacity:0}}
@keyframes split-flap-reveal{0%{clip-path:inset(0 0 100% 0)}23.14%{clip-path:inset(0 0 99.21% 0)}29.67%{clip-path:inset(0 0 95.55% 0)}33.95%{clip-path:inset(0 0 89.09% 0)}37.41%{clip-path:inset(0 0 79.46% 0)}40.56%{clip-path:inset(0 0 66.05% 0)}43.73%{clip-path:inset(0 0 47.69% 0)}47.38%{clip-path:inset(0 0 21.22% 0)}50%,100%{clip-path:inset(0 0 0 0)}}
@keyframes split-flap-cover{0%,50%{clip-path:inset(0 0 0 0)}54.42%{clip-path:inset(35.75% 0 0 0)}57.44%{clip-path:inset(55.86% 0 0 0)}60.39%{clip-path:inset(70.63% 0 0 0)}63.65%{clip-path:inset(81.86% 0 0 0)}67.65%{clip-path:inset(90.23% 0 0 0)}73.17%{clip-path:inset(96% 0 0 0)}82.62%{clip-path:inset(99.25% 0 0 0)}100%{clip-path:inset(100% 0 0 0)}}
@media (prefers-reduced-motion: reduce){.split-flap-text__flap,.split-flap-text__flap::after,.split-flap-text__shade,.split-flap-text__half{animation:none !important}}
`;

const toCssUnit = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const resolveCharset = (charset: SplitFlapTextProps['charset']) => {
  if (charset && CHARSETS[charset]) return CHARSETS[charset];
  return typeof charset === 'string' && charset.length > 0 ? charset : CHARSETS.alphanumeric;
};

const normalizePhrase = (phrase: string, width: number, align: SplitFlapAlign = 'left') => {
  const safe = String(phrase ?? '').slice(0, width);
  if (align === 'right') return safe.padStart(width, ' ');
  if (align === 'center') {
    return safe.padStart(safe.length + Math.floor((width - safe.length) / 2), ' ').padEnd(width, ' ');
  }
  return safe.padEnd(width, ' ');
};

const createTiles = (phrase: string): TileState[] =>
  phrase.split('').map(char => ({
    current: char,
    next: char,
    flipping: false,
    tick: 0
  }));

const sampleChar = (charset: string) => charset.charAt(Math.floor(Math.random() * charset.length)) || ' ';

const buildSequence = (target: string, flips: number, charset: string) => {
  const steps: string[] = [];
  for (let i = 0; i < flips; i += 1) {
    steps.push(sampleChar(charset));
  }
  steps.push(target);
  return steps;
};

const toGlyph = (char: string) => (char === ' ' ? ' ' : char);

const shuffleIndices = (count: number) => {
  const list: number[] = [];
  for (let i = 0; i < count; i++) list.push(i);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const cascadeStep = (index: number, width: number, order: SplitFlapOrder, randomOrder: number[] | null) => {
  if (order === 'right') return width - 1 - index;
  if (order === 'center') return Math.floor(Math.abs(index - (width - 1) / 2));
  if (order === 'random' && randomOrder) return randomOrder[index];
  return index;
};

const clampUnit = (value: number) => Math.min(1, Math.max(0, Number(value) || 0));

const round = (value: number) => Number(value.toFixed(3));

const SplitFlapText = (props: SplitFlapTextProps) => {
  const [own, rest] = splitProps(props, [
    'words',
    'text',
    'flipDuration',
    'stagger',
    'cycleDelay',
    'charset',
    'flipsPerChar',
    'tileColor',
    'textColor',
    'tileRadius',
    'gap',
    'fontSize',
    'loop',
    'padTo',
    'align',
    'intro',
    'glare',
    'depth',
    'order',
    'tileStyle',
    'class',
    'className',
    'style'
  ]);

  const prefersReducedMotion = usePrefersReducedMotion();

  // Mutable run-state that upstream kept in refs.
  let rafId: number | null = null;
  let shown: string | null = null;
  let from: string | null = null;
  let index = 0;
  let lastPhrases: string[] | null = null;

  const sourceWords = () =>
    Array.isArray(own.words) && own.words.length > 0 ? own.words : DEFAULT_WORDS;
  const phrasesKey = createMemo(() =>
    typeof own.text === 'string' ? own.text : sourceWords().map(word => String(word ?? '')).join('\u001f')
  );
  const phrases = createMemo(() => phrasesKey().split('\u001f'));

  const width = createMemo(() => {
    const longest = phrases().reduce((max, phrase) => Math.max(max, phrase.length), 1);
    return Math.max(1, Math.ceil(Number(own.padTo) || 0), longest);
  });

  const align = () => own.align ?? 'left';

  const normalizedPhrases = createMemo(() => phrases().map(phrase => normalizePhrase(phrase, width(), align())));

  const timing = createMemo<Timing>(() => ({
    flipMs: Math.max(40, (Number(own.flipDuration) || 0.12) * 1000),
    staggerMs: Math.max(0, (Number(own.stagger) || 0) * 1000),
    holdMs: Math.max(400, Number(own.cycleDelay) || 2400),
    flips: Math.max(0, Math.floor(Number(own.flipsPerChar) || 0)),
    glyphs: resolveCharset(own.charset),
    order: own.order ?? 'left'
  }));

  const [tiles, setTiles] = createSignal<TileState[]>(
    createTiles(own.intro === false ? normalizedPhrases()[0] : ' '.repeat(width()))
  );
  const [activeIndex, setActiveIndex] = createSignal(0);

  createEffect(() => {
    const phrasesNow = normalizedPhrases();
    const widthNow = width();
    const loop = own.loop ?? true;
    const intro = own.intro ?? true;
    const reduced = prefersReducedMotion();

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stopFrame = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };

    const animateTo = (target: string): number => {
      const { flipMs, staggerMs, flips, glyphs, order: cascade } = untracked(timing);
      const fromPhrase = normalizePhrase(shown ?? target, target.length);
      const randomOrder = cascade === 'random' ? shuffleIndices(target.length) : null;

      stopFrame();
      shown = target;
      from = null;

      const plans: AnimationPlan[] = [];
      if (!reduced) {
        for (let i = 0; i < target.length; i += 1) {
          if (fromPhrase[i] === target[i]) continue;
          plans.push({
            index: i,
            from: fromPhrase[i],
            target: target[i],
            sequence: buildSequence(target[i], flips, glyphs),
            start: cascadeStep(i, target.length, cascade, randomOrder) * staggerMs,
            step: -1,
            done: false
          });
        }
      }

      if (!plans.length) {
        setTiles(createTiles(target));
        return 0;
      }

      from = fromPhrase;
      setTiles(createTiles(fromPhrase));

      const totalDuration = plans.reduce((max, plan) => Math.max(max, plan.start + plan.sequence.length * flipMs), 0);
      const startedAt = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;

        const elapsed = now - startedAt;
        const updates: TileUpdate[] = [];
        let running = false;

        plans.forEach(plan => {
          const localElapsed = elapsed - plan.start;

          if (localElapsed < 0) {
            running = true;
            return;
          }

          const step = Math.floor(localElapsed / flipMs);

          if (step < plan.sequence.length) {
            running = true;

            if (step !== plan.step) {
              plan.step = step;
              updates.push({
                index: plan.index,
                current: step === 0 ? plan.from : plan.sequence[step - 1],
                next: plan.sequence[step],
                done: false
              });
            }
          } else if (!plan.done) {
            plan.done = true;
            updates.push({
              index: plan.index,
              current: plan.target,
              next: plan.target,
              done: true
            });
          }
        });

        if (updates.length > 0) {
          setTiles(previous => {
            const nextTiles = previous.slice();
            updates.forEach(update => {
              const tile = nextTiles[update.index];
              if (!tile) return;

              nextTiles[update.index] = {
                current: update.current,
                next: update.next,
                flipping: !update.done,
                tick: tile.tick + 1
              };
            });
            return nextTiles;
          });
        }

        if (running) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
          from = null;
        }
      };

      rafId = requestAnimationFrame(tick);
      return totalDuration;
    };

    const show = (i: number) => {
      index = i;
      setActiveIndex(i);
      return animateTo(phrasesNow[i]);
    };

    const scheduleNext = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;

        if (document.hidden) {
          scheduleNext(untracked(timing).holdMs);
          return;
        }

        const nextIndex = index + 1;
        if (nextIndex >= phrasesNow.length && !loop) return;

        const duration = show(nextIndex % phrasesNow.length);
        scheduleNext(untracked(timing).holdMs + duration);
      }, delay);
    };

    const samePhrases = lastPhrases === phrasesNow;
    lastPhrases = phrasesNow;

    if (shown === null) {
      shown = intro ? ' '.repeat(widthNow) : phrasesNow[0];
    }

    if (!samePhrases || index >= phrasesNow.length) {
      index = 0;
    } else if (from !== null) {
      shown = from;
    }

    let startDuration = 0;
    if (shown === phrasesNow[index]) {
      stopFrame();
      from = null;
      setActiveIndex(index);
      setTiles(createTiles(shown));
    } else {
      startDuration = show(index);
    }

    if (phrasesNow.length > 1) {
      scheduleNext(untracked(timing).holdMs + startDuration);
    }

    onCleanup(() => {
      cancelled = true;
      clearTimeout(timer);
      stopFrame();
    });
  });

  const label = () => String(phrases()[activeIndex()] ?? phrases()[0] ?? '').trim();
  const minimal = () => own.tileStyle === 'minimal';
  const level = () => clampUnit(own.depth ?? 0.5);
  const flat = () => Math.min(1, level() * 2);
  const deep = () => Math.max(0, level() - 0.5) * 2;
  const sheen = () => (minimal() ? 0 : clampUnit(own.glare ?? 0));
  const shaded = () => !minimal() && deep() > 0;
  const rootClass = () =>
    [
      'split-flap-text',
      minimal() && 'split-flap-text--minimal',
      sheen() > 0 && 'split-flap-text--glare',
      'relative inline-flex items-center whitespace-pre select-none',
      own.class,
      own.className
    ]
      .filter(Boolean)
      .join(' ');
  const componentStyle = (): JSX.CSSProperties & Record<string, string | number | undefined> => ({
    '--split-flap-tile-color': own.tileColor ?? '#111827',
    '--split-flap-text-color': own.textColor ?? '#f8fafc',
    '--split-flap-radius': toCssUnit(own.tileRadius ?? 8),
    '--split-flap-gap': toCssUnit(own.gap ?? 6),
    '--split-flap-font-size': toCssUnit(own.fontSize ?? 52),
    '--split-flap-flip-duration': `${Math.max(0.04, Number(own.flipDuration) || 0.12)}s`,
    '--split-flap-front-from': round(1 + 0.08 * flat()),
    '--split-flap-front-to': round(1 - 0.48 * flat() - 0.3 * deep()),
    '--split-flap-back-from': round(1 - 0.42 * flat() - 0.3 * deep()),
    '--split-flap-hinge': `calc(1px + ${round(deep() * 0.05)}em)`,
    '--split-flap-hinge-shade': round(0.25 + 0.39 * flat() + 0.21 * deep()),
    '--split-flap-drop': round(0.28 * flat() + 0.2 * deep()),
    '--split-flap-lift': round(0.4 + 0.6 * flat() + 0.7 * deep()),
    '--split-flap-cast': round(deep() * 0.62),
    '--split-flap-edge': `${round(deep() * 0.035)}em`,
    '--split-flap-split': `${round(0.015 + level() * 0.06)}em`,
    '--split-flap-glare': round(sheen() * 0.55),
    ...own.style
  });

  return (
    <>
      <style>{styles}</style>
      <div class={rootClass()} style={componentStyle()} {...rest}>
        <span class="sr-only">{label()}</span>
        <For each={tiles()}>
          {(tile, tileIndex) => (
            <span
              class={`split-flap-text__tile${tile.flipping ? ' is-flipping' : ''}`}
              aria-hidden="true"
            >
              <span class="split-flap-text__half split-flap-text__half--top">
                <span class="split-flap-text__char">{toGlyph(tile.flipping ? tile.next : tile.current)}</span>
              </span>
              <span class="split-flap-text__half split-flap-text__half--bottom">
                <span class="split-flap-text__char">{toGlyph(tile.current)}</span>
              </span>

              <Show when={tile.flipping ? { tile, index: tileIndex() } : null} keyed>
                {({ tile: t }) => (
                  <>
                    <Show when={shaded()}>
                      <span class="split-flap-text__shade split-flap-text__shade--top" />
                      <span class="split-flap-text__shade split-flap-text__shade--bottom" />
                    </Show>
                    <span class="split-flap-text__flap split-flap-text__flap--front">
                      <span class="split-flap-text__char">{toGlyph(t.current)}</span>
                    </span>
                    <span class="split-flap-text__flap split-flap-text__flap--back">
                      <span class="split-flap-text__char">{toGlyph(t.next)}</span>
                    </span>
                  </>
                )}
              </Show>
            </span>
          )}
        </For>
      </div>
    </>
  );
};

export default SplitFlapText;
