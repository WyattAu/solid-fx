import { createEffect, onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';
import HugeiconsIcon from '@/lib/HugeiconsIcon';
import { Mail01Icon } from '@hugeicons/core-free-icons';

type Palette = 'dark' | 'light';

interface ProfileCardProps {
  avatarUrl?: string;
  iconUrl?: string;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  statusColor?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  theme?: Palette;
  backdropColor?: string;
  radius?: number;
  holo?: number;
  glare?: number;
  enableTilt?: boolean;
  tiltStrength?: number;
  parallax?: number;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  intro?: boolean;
  className?: string;
  class?: string;
}

interface Engine {
  aim: (nx: number, ny: number, on?: boolean) => void;
  release: () => void;
  write: () => void;
}

type OrientationPermission = {
  requestPermission?: () => Promise<PermissionState>;
};

const THEMES: Record<Palette, JSX.CSSProperties> = {
  dark: {
    '--pc-frame': 'rgba(38, 35, 46, 0.66)',
    '--pc-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--pc-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--pc-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--pc-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--pc-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--pc-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--pc-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--pc-ink': '#f4f4f5',
    '--pc-muted': 'rgba(244, 244, 245, 0.6)',
    '--pc-hover': 'brightness(1.12)',
    '--pc-press': 'brightness(0.8)',
    '--pc-shade': 'rgba(0, 0, 0, 0.4)'
  },
  light: {
    '--pc-frame': 'rgba(240, 240, 243, 0.8)',
    '--pc-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--pc-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--pc-frame-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--pc-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--pc-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--pc-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--pc-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--pc-ink': '#27272a',
    '--pc-muted': 'rgba(39, 39, 42, 0.6)',
    '--pc-hover': 'brightness(0.97)',
    '--pc-press': 'brightness(0.92)',
    '--pc-shade': 'rgba(24, 24, 27, 0.14)'
  }
};

const FOILS: Record<Palette, JSX.CSSProperties> = {
  dark: {
    '--pc-blend': 'color-dodge',
    '--pc-holo-filter': 'hue-rotate(0deg)',
    '--pc-sheen': 'rgba(255, 255, 255, 0.16)'
  },
  light: {
    '--pc-blend': 'multiply',
    '--pc-holo-filter': 'invert(1) hue-rotate(180deg)',
    '--pc-sheen': 'rgba(255, 255, 255, 0)'
  }
};

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
)}")`;

const SPECTRUM =
  'repeating-linear-gradient(0deg, hsl(2, 100%, 73%) 5%, hsl(53, 100%, 69%) 10%, hsl(93, 100%, 69%) 15%, hsl(176, 100%, 76%) 20%, hsl(228, 100%, 74%) 25%, hsl(260, 100%, 76%) 30%, hsl(2, 100%, 73%) 35%)';
const BARS =
  'repeating-linear-gradient(-45deg, #0e152e 0%, hsl(180, 10%, 60%) 3.8%, hsl(180, 29%, 66%) 4.5%, hsl(180, 10%, 60%) 5.2%, #0e152e 10%, #0e152e 12%)';
const FALLOFF =
  'radial-gradient(farthest-corner circle at var(--pc-pointer-x) var(--pc-pointer-y), hsla(0, 0%, 0%, 0.1) 12%, hsla(0, 0%, 0%, 0.15) 20%, hsla(0, 0%, 0%, 0.25) 120%)';
const PATTERN_POSITION = 'calc(50% - var(--pc-shift-x) * 1.5) calc(65% - var(--pc-shift-y) * 1.5)';

const ROOT_VARS: JSX.CSSProperties = {
  '--pc-light-x': '50%',
  '--pc-light-y': '50%',
  '--pc-pointer-x': '50%',
  '--pc-pointer-y': '50%',
  '--pc-band-x': '50%',
  '--pc-band-y': '50%',
  '--pc-reach': 0,
  '--pc-rotate-x': '0deg',
  '--pc-rotate-y': '0deg',
  '--pc-shift-x': '0px',
  '--pc-shift-y': '0px',
  '--pc-tilt': 0,
  '--pc-active': 0
};

const SHEEN_STYLE: JSX.CSSProperties = {
  background:
    'radial-gradient(farthest-corner circle at calc(var(--pc-light-x) - 10px) calc(var(--pc-light-y) - 10px), var(--pc-sheen) 0%, transparent 55%)',
  opacity: 'calc(var(--pc-holo) * var(--pc-active))'
};

const HOLO_STYLE: JSX.CSSProperties = {
  'background-image': `${SPECTRUM}, ${BARS}, ${FALLOFF}`,
  'background-position': '0 var(--pc-band-y), var(--pc-band-x) var(--pc-band-y), center',
  'background-size': '500% 500%, 300% 300%, 200% 200%',
  'background-blend-mode': 'color, hard-light',
  filter:
    'brightness(calc(0.66 + 0.19 * var(--pc-active))) contrast(calc(1.33 + 0.17 * var(--pc-active))) saturate(calc(0.33 + 0.17 * var(--pc-active))) var(--pc-holo-filter)',
  opacity: 'calc(var(--pc-holo) * var(--pc-holo-gain) * (0.5 + 0.5 * var(--pc-active)))',
  '-webkit-mask-image': 'var(--pc-pattern)',
  '-webkit-mask-size': 'var(--pc-pattern-size)',
  '-webkit-mask-position': PATTERN_POSITION,
  '-webkit-mask-repeat': 'repeat',
  'mask-image': 'var(--pc-pattern)',
  'mask-size': 'var(--pc-pattern-size)',
  'mask-position': PATTERN_POSITION,
  'mask-repeat': 'repeat'
};

const GLOW_STYLE: JSX.CSSProperties = {
  'background-image':
    'linear-gradient(45deg, hsl(176, 100%, 76%), hsl(228, 100%, 74%), hsl(260, 100%, 76%), hsl(2, 100%, 73%), hsl(53, 100%, 69%), hsl(93, 100%, 69%)), radial-gradient(circle at var(--pc-pointer-x) var(--pc-pointer-y), hsl(0, 0%, 70%) 0%, hsla(0, 0%, 30%, 0.2) 90%), var(--pc-grain)',
  'background-size': '250% 250%, 100% 100%, 220px 220px',
  'background-position': 'var(--pc-pointer-x) var(--pc-pointer-y), center, 0 0',
  'background-blend-mode': 'color-dodge',
  filter:
    'brightness(calc(2 - var(--pc-reach))) contrast(calc(var(--pc-reach) + 2)) saturate(calc(0.5 + var(--pc-reach)))',
  'mix-blend-mode': 'luminosity',
  opacity: 'calc(var(--pc-active) * var(--pc-holo-detail))'
};

const SHIFT_STYLE: JSX.CSSProperties = {
  'background-image': `${SPECTRUM}, ${BARS}, ${FALLOFF}`,
  'background-position': '0 var(--pc-band-y), calc(var(--pc-band-x) * 0.4) calc(var(--pc-band-y) * 0.5), center',
  'background-size': '200% 300%, 700% 700%, 100% 100%',
  'background-blend-mode': 'color, hard-light',
  'mix-blend-mode': 'difference',
  filter: 'brightness(0.8) contrast(1.5)',
  opacity: 'calc(var(--pc-active) * var(--pc-holo-detail))'
};

const PHOTO_STYLE: JSX.CSSProperties = {
  inset: 'calc(var(--pc-parallax) * -1)',
  width: 'calc(100% + var(--pc-parallax) * 2)',
  height: 'calc(100% + var(--pc-parallax) * 2)',
  transform: 'translate3d(var(--pc-shift-x), var(--pc-shift-y), 0)'
};

const SCRIM_STYLE: JSX.CSSProperties = {
  background:
    'linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.57) 6%, rgba(0, 0, 0, 0.5) 12%, rgba(0, 0, 0, 0.4) 19%, rgba(0, 0, 0, 0.28) 26%, rgba(0, 0, 0, 0.16) 33%, rgba(0, 0, 0, 0.07) 40%, rgba(0, 0, 0, 0.02) 46%, rgba(0, 0, 0, 0) 52%)'
};

const GLARE_STYLE: JSX.CSSProperties = {
  background:
    'radial-gradient(farthest-corner circle at var(--pc-light-x) var(--pc-light-y), rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.36) 20%, rgba(255, 255, 255, 0) 60%)',
  opacity: 'calc(var(--pc-glare) * var(--pc-active))'
};

const SHADE_STYLE: JSX.CSSProperties = {
  background:
    'radial-gradient(farthest-corner circle at var(--pc-light-x) var(--pc-light-y), transparent 30%, var(--pc-shade) 100%)',
  opacity: 'calc(var(--pc-glare) * var(--pc-tilt))'
};

const ROOT = 'relative w-[340px] max-w-full touch-pan-y [perspective:1000px] [-webkit-tap-highlight-color:transparent]';
const BODY =
  'relative flex flex-col gap-[10px] rounded-[calc(var(--pc-radius)+10px)] p-[10px] backdrop-blur-[20px] backdrop-saturate-[1.6] will-change-transform [background:var(--pc-frame)] [box-shadow:var(--pc-frame-shadow)] [transform:rotateX(var(--pc-rotate-x))_rotateY(var(--pc-rotate-y))]';
const TILE =
  'relative isolate aspect-[4/5] overflow-hidden rounded-[var(--pc-radius)] [background:var(--pc-backdrop)] [box-shadow:var(--pc-tile-shadow)]';
const LAYER = 'pointer-events-none absolute inset-0 rounded-[inherit]';
const HOLO = `${LAYER} [mix-blend-mode:var(--pc-blend)]`;
const HOLO_LAYER = 'absolute inset-0';
const PHOTO = 'pointer-events-none absolute select-none object-cover object-bottom';
const INFO = 'absolute bottom-[18px] left-5 right-5 text-white';
const NAME = 'm-0 text-[20px] font-semibold leading-[1.25] tracking-[-0.01em] text-[inherit]';
const TITLE = 'mx-0 mb-0 mt-1 text-[14px] leading-[1.45] text-white/78';
const TILE_RIM = `${LAYER} [box-shadow:inset_0_0_0_1px_var(--pc-tile-edge),inset_0_1px_0_var(--pc-tile-highlight)]`;
const FOOTER = 'flex min-w-0 items-center gap-3 px-5 pb-2 pt-1.5';
const AVATAR =
  "relative h-9 w-9 flex-none overflow-hidden rounded-full [background:var(--pc-tile)] after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:[box-shadow:inset_0_0_0_1px_var(--pc-tile-edge)]";
const AVATAR_IMAGE = 'block h-full w-full object-cover object-top';
const META = 'flex min-w-0 flex-1 flex-col gap-[3px]';
const HANDLE =
  'overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold leading-[1.25] text-[var(--pc-ink)]';
const STATUS =
  "flex items-center gap-1.5 whitespace-nowrap text-[12.5px] leading-[1.25] text-[var(--pc-muted)] before:h-1.5 before:w-1.5 before:flex-none before:rounded-full before:bg-[var(--pc-status)] before:content-['']";
const CONTACT =
  'flex h-9 flex-none cursor-pointer items-center gap-1.5 rounded-[calc(var(--pc-radius)*0.75)] border-none px-3.5 font-[inherit] text-[13px] font-semibold text-[var(--pc-ink)] [background:var(--pc-tile)] [box-shadow:inset_0_0_0_1px_var(--pc-tile-edge),inset_0_1px_0_var(--pc-tile-highlight),var(--pc-tile-shadow)] transition-[filter,transform] duration-200 hover:[filter:var(--pc-hover)] active:scale-[0.96] active:duration-0 active:[filter:var(--pc-press)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-ink)]';
const GLARE = `${LAYER} mix-blend-overlay`;
const RIM = `${LAYER} [box-shadow:inset_0_0_0_1px_var(--pc-frame-edge),inset_0_1px_0_var(--pc-frame-highlight)]`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isDark = (color: string): boolean | null => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].replace(/./g, digit => digit + digit) : match[1];
  const [r, g, b] = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
};

const ProfileCard = (props: ProfileCardProps) => {
  let rootRef!: HTMLDivElement;
  let engineRef: Engine | null = null;

  onMount(() => {
    const root = rootRef;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const size = { width: root.offsetWidth, height: root.offsetHeight };
    const x = { p: 0, v: 0, target: 0 };
    const y = { p: 0, v: 0, target: 0 };
    const light = { p: 0, target: 0 };
    let raf = 0;
    let last = 0;
    let slowUntil = 0;
    let touchId: number | null = null;

    const write = () => {
      const tiltOn = props.enableTilt ?? true;
      const strength = props.tiltStrength ?? 12;
      const depth = props.parallax ?? 8;
      const angle = tiltOn && !reduced ? strength : 0;
      const tilt = Math.min(1, Math.hypot(x.p, y.p));
      const style = root.style;
      style.setProperty('--pc-light-x', `${((x.p + 1) * 0.5 * size.width).toFixed(1)}px`);
      style.setProperty('--pc-light-y', `${((y.p + 1) * 0.5 * size.height).toFixed(1)}px`);
      style.setProperty('--pc-pointer-x', `${((x.p + 1) * 50).toFixed(2)}%`);
      style.setProperty('--pc-pointer-y', `${((y.p + 1) * 50).toFixed(2)}%`);
      style.setProperty('--pc-band-x', `${(50 + x.p * 15).toFixed(2)}%`);
      style.setProperty('--pc-band-y', `${(50 + y.p * 15).toFixed(2)}%`);
      style.setProperty('--pc-rotate-x', `${(y.p * angle).toFixed(3)}deg`);
      style.setProperty('--pc-rotate-y', `${(-x.p * angle).toFixed(3)}deg`);
      style.setProperty('--pc-shift-x', `${(x.p * (reduced ? 0 : depth)).toFixed(2)}px`);
      style.setProperty('--pc-shift-y', `${(y.p * (reduced ? 0 : depth)).toFixed(2)}px`);
      style.setProperty('--pc-reach', tilt.toFixed(4));
      style.setProperty('--pc-tilt', (tilt * light.p).toFixed(4));
      style.setProperty('--pc-active', light.p.toFixed(4));
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const slow = now < slowUntil;
      const stiffness = slow ? 24 : 120;
      const damping = slow ? 9 : 16;
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        for (const axis of [x, y]) {
          axis.v += (stiffness * (axis.target - axis.p) - damping * axis.v) * h;
          axis.p += axis.v * h;
        }
      }
      const tau = light.target > light.p ? 0.18 : slow ? 0.9 : 0.45;
      light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));
      write();
      const moving =
        Math.abs(x.target - x.p) > 0.0005 ||
        Math.abs(y.target - y.p) > 0.0005 ||
        Math.abs(x.v) > 0.0005 ||
        Math.abs(y.v) > 0.0005 ||
        Math.abs(light.target - light.p) > 0.002;
      if (moving) {
        raf = requestAnimationFrame(frame);
      } else {
        x.p = x.target;
        y.p = y.target;
        light.p = light.target;
        write();
        raf = 0;
      }
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const aim = (nx: number, ny: number, on = true) => {
      x.target = clamp(nx, -1, 1);
      y.target = clamp(ny, -1, 1);
      light.target = on ? 1 : 0;
      slowUntil = 0;
      wake();
    };

    const aimAt = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      aim(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const release = () => aim(0, 0, false);

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') aimAt(event);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || event.pointerId === touchId) aimAt(event);
    };
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') release();
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      touchId = event.pointerId;
      aimAt(event);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== touchId) return;
      touchId = null;
      release();
    };

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);

    const observer = new ResizeObserver(() => {
      size.width = root.offsetWidth;
      size.height = root.offsetHeight;
      write();
    });
    observer.observe(root);

    engineRef = { aim, release, write };

    if ((props.intro ?? true) && !reduced) {
      x.p = 0.62;
      y.p = -0.55;
      light.p = 1;
      slowUntil = performance.now() + 1400;
      write();
      wake();
    } else {
      write();
    }

    onCleanup(() => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      engineRef = null;
    });
  });

  createEffect(() => {
    // Upstream deps: [enableTilt, tiltStrength, parallax]
    void props.enableTilt;
    void props.tiltStrength;
    void props.parallax;
    engineRef?.write();
  });

  createEffect(() => {
    const root = rootRef;
    if (!root || !props.enableMobileTilt) return;

    let listening = false;
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null) return;
      const sensitivity = props.mobileTiltSensitivity ?? 5;
      engineRef?.aim((event.gamma * sensitivity) / 150, ((event.beta - 20) * sensitivity) / 150);
    };
    const listen = () => {
      if (listening) return;
      listening = true;
      window.addEventListener('deviceorientation', onOrientation);
    };
    const onClick = () => {
      const Motion = window.DeviceOrientationEvent as unknown as OrientationPermission | undefined;
      if (Motion && typeof Motion.requestPermission === 'function') {
        Motion.requestPermission()
          .then(state => {
            if (state === 'granted') listen();
          })
          .catch(() => {});
      } else {
        listen();
      }
    };

    root.addEventListener('click', onClick);
    onCleanup(() => {
      root.removeEventListener('click', onClick);
      window.removeEventListener('deviceorientation', onOrientation);
    });
  });

  const palette = (): Palette => (props.theme === 'light' ? 'light' : 'dark');
  const foil = (): Palette =>
    props.backdropColor ? ((isDark(props.backdropColor) ?? palette() === 'dark') ? 'dark' : 'light') : palette();
  const backdrop = () =>
    props.backdropColor
      ? `linear-gradient(180deg, color-mix(in srgb, ${props.backdropColor}, #ffffff 12%) 0%, color-mix(in srgb, ${props.backdropColor}, #000000 18%) 100%)`
      : 'var(--pc-tile)';

  return (
    <div
      ref={rootRef}
      class={`${ROOT} ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={{
        ...ROOT_VARS,
        ...THEMES[palette()],
        ...FOILS[foil()],
        '--pc-radius': `${Math.max(0, props.radius ?? 16)}px`,
        '--pc-backdrop': backdrop(),
        '--pc-holo': clamp(props.holo ?? 0.8, 0, 1),
        '--pc-glare': clamp(props.glare ?? 0.5, 0, 1),
        '--pc-parallax': `${Math.max(0, props.parallax ?? 8)}px`,
        '--pc-status': props.statusColor ?? '#22c55e',
        '--pc-grain': GRAIN,
        '--pc-pattern': props.iconUrl ? `url("${props.iconUrl}")` : 'linear-gradient(#000, #000)',
        '--pc-pattern-size': props.iconUrl ? '180% auto' : '100% 100%',
        '--pc-holo-gain': props.iconUrl ? 1.25 : 0.75,
        '--pc-holo-detail': props.iconUrl && foil() === 'dark' ? 1 : 0
      }}
    >
      <div class={BODY}>
        <div class={TILE}>
          <span class={LAYER} style={SHEEN_STYLE} />
          <span class={HOLO} style={HOLO_STYLE}>
            <span class={HOLO_LAYER} style={GLOW_STYLE} />
            <span class={HOLO_LAYER} style={SHIFT_STYLE} />
          </span>
          {props.avatarUrl && (
            <img
              class={PHOTO}
              style={PHOTO_STYLE}
              src={props.avatarUrl}
              alt={props.name || ''}
              loading="lazy"
              draggable={false}
            />
          )}
          {(props.name || props.title) && (
            <>
              <span class={LAYER} style={SCRIM_STYLE} />
              <div class={INFO}>
                {props.name && <h3 class={NAME}>{props.name}</h3>}
                {props.title && <p class={TITLE}>{props.title}</p>}
              </div>
            </>
          )}
          <span class={TILE_RIM} />
        </div>

        {props.showUserInfo && (
          <div class={FOOTER}>
            {props.miniAvatarUrl && (
              <span class={AVATAR}>
                <img class={AVATAR_IMAGE} src={props.miniAvatarUrl} alt="" loading="lazy" draggable={false} />
              </span>
            )}
            <div class={META}>
              {props.handle && <span class={HANDLE}>@{props.handle}</span>}
              {props.status && <span class={STATUS}>{props.status}</span>}
            </div>
            {props.contactText && (
              <button
                type="button"
                class={CONTACT}
                onClick={() => props.onContactClick?.()}
                aria-label={props.name ? `${props.contactText} ${props.name}` : props.contactText}
              >
                <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={1.8} />
                {props.contactText}
              </button>
            )}
          </div>
        )}

        <span class={GLARE} style={GLARE_STYLE} />
        <span class={LAYER} style={SHADE_STYLE} />
        <span class={RIM} />
      </div>
    </div>
  );
};

export default ProfileCard;
