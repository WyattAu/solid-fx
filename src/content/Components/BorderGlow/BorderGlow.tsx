import { createEffect, createSignal, onCleanup } from 'solid-js';
import type { JSX } from 'solid-js';

interface BorderGlowProps {
  children?: JSX.Element;
  className?: string;
  class?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
}

function parseHSL(hslStr: string): { h: number; s: number; l: number } {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildBoxShadow(glowColor: string, intensity: number): string {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const layers: [number, number, number, number, number, boolean][] = [
    [0, 0, 0, 1, 100, true], [0, 0, 1, 0, 60, true], [0, 0, 3, 0, 50, true],
    [0, 0, 6, 0, 40, true], [0, 0, 15, 0, 30, true], [0, 0, 25, 2, 20, true],
    [0, 0, 50, 2, 10, true],
    [0, 0, 1, 0, 60, false], [0, 0, 3, 0, 50, false], [0, 0, 6, 0, 40, false],
    [0, 0, 15, 0, 30, false], [0, 0, 25, 2, 20, false], [0, 0, 50, 2, 10, false],
  ];
  return layers.map(([x, y, blur, spread, alpha, inset]) => {
    const a = Math.min(alpha * intensity, 100);
    return `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px hsl(${base} / ${a}%)`;
  }).join(', ');
}

function easeOutCubic(x: number) { return 1 - Math.pow(1 - x, 3); }
function easeInCubic(x: number) { return x * x * x; }

interface AnimateOpts {
  start?: number; end?: number; duration?: number; delay?: number;
  ease?: (t: number) => number; onUpdate: (v: number) => void; onEnd?: () => void;
}

// Same tween as upstream, plus a cancel handle so the sweep stops on unmount.
function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }: AnimateOpts): () => void {
  const t0 = performance.now() + delay;
  let raf = 0;
  function tick() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) raf = requestAnimationFrame(tick);
    else if (onEnd) onEnd();
  }
  const timer = setTimeout(() => {
    raf = requestAnimationFrame(tick);
  }, delay);
  return () => {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
  };
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildMeshGradients(colors: string[]): string[] {
  const gradients: string[] = [];
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    gradients.push(`radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`);
  }
  gradients.push(`linear-gradient(${colors[0]} 0 100%)`);
  return gradients;
}

function isLightColor(color: string): boolean {
  const value = color.trim().replace('#', '');
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return false;
  const hex = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
}

const BorderGlow = (props: BorderGlowProps) => {
  let card!: HTMLDivElement;
  const [isHovered, setIsHovered] = createSignal(false);
  const [cursorAngle, setCursorAngle] = createSignal(45);
  const [edgeProximity, setEdgeProximity] = createSignal(0);
  const [sweepActive, setSweepActive] = createSignal(false);

  const getCenterOfElement = (el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  };

  const getEdgeProximity = (el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  };

  const getCursorAngle = (el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  };

  const handlePointerMove = (e: PointerEvent) => {
    const el = card;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setEdgeProximity(getEdgeProximity(el, x, y));
    setCursorAngle(getCursorAngle(el, x, y));
  };

  createEffect(() => {
    const animated = props.animated ?? false;
    if (!animated) return;
    const angleStart = 110;
    const angleEnd = 465;
    setSweepActive(true);
    setCursorAngle(angleStart);

    const cancels = [
      animateValue({ duration: 500, onUpdate: v => setEdgeProximity(v / 100) }),
      animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {
        setCursorAngle((angleEnd - angleStart) * (v / 100) + angleStart);
      }}),
      animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {
        setCursorAngle((angleEnd - angleStart) * (v / 100) + angleStart);
      }}),
      animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: 100, end: 0,
        onUpdate: v => setEdgeProximity(v / 100),
        onEnd: () => setSweepActive(false),
      }),
    ];
    onCleanup(() => cancels.forEach(cancel => cancel()));
  });

  const colorSensitivity = () => (props.edgeSensitivity ?? 30) + 20;
  const isVisible = () => isHovered() || sweepActive();
  const borderOpacity = () =>
    isVisible()
      ? Math.max(0, (edgeProximity() * 100 - colorSensitivity()) / (100 - colorSensitivity()))
      : 0;
  const glowOpacity = () =>
    isVisible()
      ? Math.max(0, (edgeProximity() * 100 - (props.edgeSensitivity ?? 30)) / (100 - (props.edgeSensitivity ?? 30)))
      : 0;

  const meshGradients = () => buildMeshGradients(props.colors ?? ['#c084fc', '#f472b6', '#38bdf8']);
  const borderBg = () => meshGradients().map(g => `${g} border-box`);
  const fillBg = () => meshGradients().map(g => `${g} padding-box`);
  const angleDeg = () => `${cursorAngle().toFixed(3)}deg`;
  const lightSurface = () => isLightColor(props.backgroundColor ?? '#120F17');

  const edgeMask = () =>
    `conic-gradient(from ${angleDeg()} at center, black ${(props.coneSpread ?? 25)}%, transparent ${(props.coneSpread ?? 25) + 15}%, transparent ${100 - (props.coneSpread ?? 25) - 15}%, black ${100 - (props.coneSpread ?? 25)}%)`;
  const fillMask = () =>
    [
      'linear-gradient(to bottom, black, black)',
      'radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)',
      'radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)',
      'radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)',
      'radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%)',
      'radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%)',
      `conic-gradient(from ${angleDeg()} at center, transparent 5%, black 15%, black 85%, transparent 95%)`
    ].join(', ');

  return (
    <div
      ref={card}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      class={`relative grid isolate border ${props.class ?? ''} ${props.className ?? ''}`}
      style={{
        background: props.backgroundColor ?? '#120F17',
        'border-color': lightSurface() ? 'rgb(24 24 27 / 12%)' : 'rgb(255 255 255 / 15%)',
        'border-radius': `${props.borderRadius ?? 28}px`,
        transform: 'translate3d(0, 0, 0.01px)',
        'box-shadow': lightSurface()
          ? 'rgb(24 24 27 / 4%) 0 1px 2px, rgb(24 24 27 / 5%) 0 8px 24px'
          : 'rgba(0,0,0,0.1) 0 1px 2px, rgba(0,0,0,0.1) 0 2px 4px, rgba(0,0,0,0.1) 0 4px 8px, rgba(0,0,0,0.1) 0 8px 16px, rgba(0,0,0,0.1) 0 16px 32px, rgba(0,0,0,0.1) 0 32px 64px'
      }}
    >
      {/* mesh gradient border */}
      <div
        class="absolute inset-0 rounded-[inherit] -z-[1]"
        style={{
          border: '1px solid transparent',
          background: [
            `linear-gradient(${props.backgroundColor ?? '#120F17'} 0 100%) padding-box`,
            'linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box',
            ...borderBg()
          ].join(', '),
          opacity: borderOpacity(),
          'mask-image': edgeMask(),
          '-webkit-mask-image': edgeMask(),
          transition: isVisible() ? 'opacity 0.25s ease-out' : 'opacity 0.75s ease-in-out'
        }}
      />

      {/* mesh gradient fill near edges */}
      <div
        class="absolute inset-0 rounded-[inherit] -z-[1]"
        style={
          {
            border: '1px solid transparent',
            background: fillBg().join(', '),
            'mask-image': fillMask(),
            '-webkit-mask-image': fillMask(),
            'mask-composite': 'subtract, add, add, add, add, add',
            '-webkit-mask-composite': 'source-out, source-over, source-over, source-over, source-over, source-over',
            opacity: borderOpacity() * (props.fillOpacity ?? 0.5),
            'mix-blend-mode': lightSurface() ? 'normal' : 'soft-light',
            transition: isVisible() ? 'opacity 0.25s ease-out' : 'opacity 0.75s ease-in-out'
          } as JSX.CSSProperties
        }
      />

      {/* outer glow */}
      <span
        class="absolute pointer-events-none z-[1] rounded-[inherit]"
        style={{
          inset: `${-(props.glowRadius ?? 40)}px`,
          'mask-image': `conic-gradient(from ${angleDeg()} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
          '-webkit-mask-image': `conic-gradient(from ${angleDeg()} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
          opacity: glowOpacity(),
          'mix-blend-mode': lightSurface() ? 'normal' : 'plus-lighter',
          transition: isVisible() ? 'opacity 0.25s ease-out' : 'opacity 0.75s ease-in-out'
        }}
      >
        <span
          class="absolute rounded-[inherit]"
          style={{
            inset: `${props.glowRadius ?? 40}px`,
            'box-shadow': buildBoxShadow(props.glowColor ?? '40 80 80', props.glowIntensity ?? 1.0)
          }}
        />
      </span>

      <div class="flex flex-col relative overflow-auto z-[1]">{props.children}</div>
    </div>
  );
};

export default BorderGlow;
