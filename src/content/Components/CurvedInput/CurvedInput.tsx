import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import type { JSX } from 'solid-js'

const DEG = 180 / Math.PI

const round2 = (n: number): number => Math.round(n * 100) / 100

const hexToRgba = (hex: string, alpha: number): string => {
  let h = String(hex).replace('#', '')
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  const n = parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(n)) return hex
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

type ShadowSize = 'sm' | 'md' | 'lg'
type Theme = 'dark' | 'light'

const SHADOWS: Record<ShadowSize, [number, number, number]> = {
  sm: [5, 12, 0.3],
  md: [10, 24, 0.4],
  lg: [16, 40, 0.52],
}

interface ThemePalette {
  backgroundColor: string
  textColor: string
  placeholderColor: string
  borderColor: string
  buttonColor: string
  buttonTextColor: string
  shadowColor: string
}

const THEMES: Record<Theme, ThemePalette> = {
  dark: {
    backgroundColor: '#1B1722',
    textColor: '#f5f5f5',
    placeholderColor: '#a1a1aa',
    borderColor: '#392e4e',
    buttonColor: '#A855F7',
    buttonTextColor: '#ffffff',
    shadowColor: '#000000',
  },
  light: {
    backgroundColor: '#ffffff',
    textColor: '#1d2050',
    placeholderColor: '#9aa0b6',
    borderColor: '#262a56',
    buttonColor: '#4763eb',
    buttonTextColor: '#ffffff',
    shadowColor: '#0b0e2a',
  },
}

interface Geometry {
  straight: boolean
  W: number
  T: number
  svgH: number
  R?: number
  dir?: number
  uPerLen: number
  point: (u: number, v: number) => [number, number]
  angleAt: (u: number) => number
  uFromPoint: (x: number, y?: number) => number
}

// Maps the flat coordinate space (u: 0..W along the bar, v: offset from the
// centerline, positive down) onto a circular arc with the given sagitta
// (`bend`, in px). Positive bend arches up, negative sags down, 0 is flat.
const buildGeometry = (width: number, bend: number, thickness: number, pad: number): Geometry => {
  const W = width
  const T = thickness
  const s = Math.max(-W * 0.35, Math.min(bend, W * 0.35))
  const a = Math.abs(s)
  const dir = s >= 0 ? 1 : -1
  const svgH = T + a + pad * 2

  if (a < 0.75) {
    const midY = pad + T / 2
    return {
      straight: true,
      W,
      T,
      svgH,
      uPerLen: 1,
      point: (u, v) => [u, midY + v],
      angleAt: () => 0,
      uFromPoint: x => x,
    }
  }

  const R = (W * W * 0.25 + a * a) / (2 * a)
  const cx = W / 2
  const apexY = pad + T / 2 + (dir > 0 ? 0 : a)
  const cy = apexY + dir * R
  const phi = Math.asin(Math.min(1, W / (2 * R)))

  return {
    straight: false,
    W,
    T,
    svgH,
    R,
    dir,
    uPerLen: W / (2 * R * phi),
    point: (u, v) => {
      const th = ((u - cx) / cx) * phi
      const rho = R - dir * v
      return [cx + rho * Math.sin(th), cy - dir * rho * Math.cos(th)]
    },
    angleAt: u => dir * ((u - cx) / cx) * phi * DEG,
    uFromPoint: (x, y = 0) => {
      const th = Math.atan2(x - cx, dir * (cy - y))
      return cx + (th / phi) * cx
    },
  }
}

const fmt = (g: Geometry, u: number, v: number): string => {
  const [x, y] = g.point(u, v)
  return `${round2(x)} ${round2(y)}`
}

// Segment along a constant-v edge, as a circular arc (or a line when flat)
const edgeSeg = (g: Geometry, uTo: number, v: number, ltr: boolean): string => {
  if (g.straight) return `L ${fmt(g, uTo, v)}`
  const rho = round2(g.R! - g.dir! * v)
  const sweep = ltr === g.dir! > 0 ? 1 : 0
  return `A ${rho} ${rho} 0 0 ${sweep} ${fmt(g, uTo, v)}`
}

// A rectangle bent along the arc: circular top/bottom edges, radial end caps
// and quadratic rounded corners.
const bentRectPath = (
  g: Geometry,
  u0: number,
  u1: number,
  vTop: number,
  vBot: number,
  radius: number,
): string => {
  const rc = Math.max(0, Math.min(radius, (vBot - vTop) / 2, (u1 - u0) / 2))
  return [
    `M ${fmt(g, u0 + rc, vTop)}`,
    edgeSeg(g, u1 - rc, vTop, true),
    `Q ${fmt(g, u1, vTop)} ${fmt(g, u1, vTop + rc)}`,
    `L ${fmt(g, u1, vBot - rc)}`,
    `Q ${fmt(g, u1, vBot)} ${fmt(g, u1 - rc, vBot)}`,
    edgeSeg(g, u0 + rc, vBot, false),
    `Q ${fmt(g, u0, vBot)} ${fmt(g, u0, vBot - rc)}`,
    `L ${fmt(g, u0, vTop + rc)}`,
    `Q ${fmt(g, u0, vTop)} ${fmt(g, u0 + rc, vTop)}`,
    'Z',
  ].join(' ')
}

const bentLinePath = (g: Geometry, u0: number, u1: number, v: number): string =>
  `M ${fmt(g, u0, v)} ${edgeSeg(g, u1, v, true)}`

const SELECTABLE_TYPES = ['text', 'search', 'tel', 'url', 'password']

interface CurvedInputProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  buttonText?: string
  type?: string
  name?: string
  ariaLabel?: string
  theme?: Theme
  width?: number | string
  bend?: number
  height?: number
  cornerRadius?: number
  borderWidth?: number
  fontSize?: number
  backgroundColor?: string
  textColor?: string
  placeholderColor?: string
  borderColor?: string
  buttonColor?: string
  buttonTextColor?: string
  iconColor?: string
  shadowSize?: ShadowSize
  shadowColor?: string
  showButton?: boolean
  showIcon?: boolean
  icon?: JSX.Element
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

const CurvedInput = (props: CurvedInputProps) => {
  const uid = createUniqueId()
  const layoutPathId = `ci-text-${uid}`
  const buttonPathId = `ci-btn-${uid}`
  const clipId = `ci-clip-${uid}`

  let rootRef!: HTMLFormElement
  let svgRef!: SVGSVGElement
  let inputRef!: HTMLInputElement
  let textRef!: SVGTextElement
  let btnMeasureRef!: SVGTextElement
  let scroll = 0 // upstream scrollRef (mutable, non-reactive)

  const [w, setW] = createSignal(0)
  const [innerValue, setInnerValue] = createSignal(props.defaultValue ?? '')
  const [caretIndex, setCaretIndex] = createSignal((props.defaultValue ?? '').length)
  const [focused, setFocused] = createSignal(false)
  const [caretU, setCaretU] = createSignal(0)
  const [scrollLen, setScrollLen] = createSignal(0)
  const [btnTextW, setBtnTextW] = createSignal(0)
  const [fontTick, setFontTick] = createSignal(0)

  const val = () => (props.value !== undefined ? props.value : innerValue())
  const display = () => (props.type === 'password' ? '•'.repeat(val().length) : val())

  const palette = () => THEMES[props.theme ?? 'dark'] || THEMES.dark
  const bgColor = () => props.backgroundColor ?? palette().backgroundColor
  const fgColor = () => props.textColor ?? palette().textColor
  const phColor = () => props.placeholderColor ?? palette().placeholderColor
  const strokeColor = () => props.borderColor ?? palette().borderColor
  const accentColor = () => props.buttonColor ?? palette().buttonColor
  const btnFgColor = () => props.buttonTextColor ?? palette().buttonTextColor
  const shColor = () => props.shadowColor ?? palette().shadowColor

  onMount(() => {
    const el = rootRef
    const ro = new ResizeObserver(entries => {
      const cw = entries[0]?.contentRect?.width ?? el.clientWidth
      setW(Math.round(cw))
    })
    ro.observe(el)
    onCleanup(() => ro.disconnect())
  })

  // Re-measure once webfonts finish loading
  onMount(() => {
    let alive = true
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) setFontTick(t => t + 1)
      })
    }
    onCleanup(() => {
      alive = false
    })
  })

  const pad = () => Math.ceil((props.borderWidth ?? 1.5) / 2) + 6
  const geom = createMemo<Geometry | null>(() =>
    w() > 2 ? buildGeometry(w(), props.bend ?? 28, props.height ?? 64, pad()) : null,
  )

  const layout = createMemo(() => {
    const g = geom()
    if (!g) return null
    const T = props.height ?? 64
    const borderWidth = props.borderWidth ?? 1.5
    const showIcon = props.showIcon ?? true
    const showButton = props.showButton ?? true
    const btnInset = Math.max(5, borderWidth + 4)
    const chipH = Math.min(34, Math.max(16, T * 0.34))
    const chipW = chipH * 1.25
    const iconU = 22 + chipW / 2
    const textStartU = showIcon ? 22 + chipW + 13 : 24
    const btnW = showButton ? Math.max(btnTextW() + (props.fontSize ?? 16) * 2.7, T * 1.35) : 0
    const btnU1 = g.W - btnInset
    const btnU0 = btnU1 - btnW
    const textEndU = Math.max(textStartU + 20, showButton ? btnU0 - 14 : g.W - 24)
    const winLen = (textEndU - textStartU) / g.uPerLen
    return { btnInset, chipH, chipW, iconU, textStartU, textEndU, btnU0, btnU1, winLen }
  })

  // Measure rendered text to keep the caret on the curve and scroll long
  // values along the arc, exactly like a native input would.
  createEffect(() => {
    fontTick()
    if (btnMeasureRef) {
      const bw = btnMeasureRef.getComputedTextLength()
      setBtnTextW(prev => (Math.abs(prev - bw) > 0.5 ? bw : prev))
    }
    const g = geom()
    const lay = layout()
    if (!g || !lay) return
    const textEl = textRef
    const shown = display()
    const caret = Math.min(caretIndex(), shown.length)
    let caretLen = 0
    let totalLen = 0
    if (textEl && shown.length) {
      try {
        totalLen = textEl.getSubStringLength(0, shown.length)
        caretLen = caret > 0 ? textEl.getSubStringLength(0, caret) : 0
      } catch {
        totalLen = 0
        caretLen = 0
      }
    }
    let next = scroll
    if (caretLen - next > lay.winLen - 2) next = caretLen - lay.winLen + 2
    if (caretLen - next < 0) next = caretLen
    if (totalLen - next < lay.winLen) next = Math.max(0, totalLen - lay.winLen)
    next = Math.max(0, next)
    if (Math.abs(next - scroll) > 0.5) {
      scroll = next
      setScrollLen(next)
    }
    setCaretU(lay.textStartU + (caretLen - next) * g.uPerLen)
  })

  const commitValue = (v: string) => {
    if (props.value === undefined) setInnerValue(v)
    props.onChange?.(v)
  }

  const handleInputChange = (e: Event & { currentTarget: HTMLInputElement }) => {
    commitValue(e.currentTarget.value)
    setCaretIndex(e.currentTarget.selectionStart ?? e.currentTarget.value.length)
  }

  const handleSelect = (e: Event & { currentTarget: HTMLInputElement }) => {
    const target = e.currentTarget
    setCaretIndex(target.selectionStart ?? target.value.length)
  }

  const handleSubmit = (e?: Event) => {
    e?.preventDefault()
    if (props.onSubmit) props.onSubmit(val())
  }

  // Click on the curve: focus the hidden input and drop the caret on the
  // character closest to the click, measured in arc length.
  const handleSurfaceClick = (e: MouseEvent & { currentTarget: SVGSVGElement }) => {
    const input = inputRef
    if (!input) return
    let idx = display().length
    const g = geom()
    const lay = layout()
    const textEl = textRef
    if (svgRef && g && lay && textEl && display().length) {
      try {
        const ctm = svgRef.getScreenCTM()
        if (!ctm) throw new Error('missing screen CTM')
        const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
        const target = scroll + (g.uFromPoint(pt.x, pt.y) - lay.textStartU) / g.uPerLen
        let best = 0
        let bestDist = Infinity
        for (let i = 0; i <= display().length; i++) {
          const li = i === 0 ? 0 : textEl.getSubStringLength(0, i)
          const d = Math.abs(li - target)
          if (d < bestDist) {
            bestDist = d
            best = i
          }
        }
        idx = best
      } catch {
        idx = display().length
      }
    }
    input.focus()
    try {
      input.setSelectionRange(idx, idx)
    } catch {
      /* selection API unavailable for this input type */
    }
    setCaretIndex(idx)
  }

  const safeType = () => (SELECTABLE_TYPES.includes(props.type ?? 'email') ? props.type : 'text')
  const inputMode = () =>
    props.type === 'email' ? 'email' : props.type === 'number' ? 'decimal' : undefined

  const shadow = () => SHADOWS[props.shadowSize ?? 'md']
  const svgStyle = (): JSX.CSSProperties | undefined => {
    const s = shadow()
    return s
      ? { filter: `drop-shadow(0 ${s[0]}px ${s[1]}px ${hexToRgba(shColor(), s[2])})` }
      : undefined
  }

  const content = createMemo<JSX.Element | null>(() => {
    const g = geom()
    const lay = layout()
    if (!g || !lay) return null
    const T = props.height ?? 64
    const vBase = (props.fontSize ?? 16) * 0.34
    const scrollU = scrollLen() * g.uPerLen
    const bandPath = bentRectPath(g, 0, g.W, -T / 2, T / 2, props.cornerRadius ?? 18)
    const layoutPath = bentLinePath(g, lay.textStartU - scrollU, g.W, vBase)
    const clipPath = bentRectPath(g, lay.textStartU - 6, lay.textEndU + 8, -T / 2, T / 2, 0)

    const chipFill = props.iconColor || accentColor()
    const { chipW, chipH } = lay
    const ew = chipW * 0.5
    const eh = chipH * 0.5
    const sw = Math.max(1.1, chipH * 0.075)
    const [ix, iy] = g.point(lay.iconU, 0)
    const iconAngle = g.angleAt(lay.iconU)

    const [caretX, caretY] = g.point(caretU(), 0)
    const caretAngle = g.angleAt(caretU())
    const caretH = Math.min(T * 0.58, (props.fontSize ?? 16) * 1.45)

    const btnH = T - lay.btnInset * 2
    const buttonPath =
      (props.showButton ?? true)
        ? bentRectPath(
            g,
            lay.btnU0,
            lay.btnU1,
            -T / 2 + lay.btnInset,
            T / 2 - lay.btnInset,
            Math.min((props.cornerRadius ?? 18) * 0.72, btnH / 2),
          )
        : ''
    const buttonTextPath =
      (props.showButton ?? true) ? bentLinePath(g, lay.btnU0, lay.btnU1, vBase) : ''

    return (
      <svg
        ref={svgRef}
        class="block w-full h-auto overflow-visible [&_text]:font-[inherit] cursor-text select-none [-webkit-tap-highlight-color:transparent]"
        width={g.W}
        height={round2(g.svgH)}
        viewBox={`0 0 ${g.W} ${round2(g.svgH)}`}
        style={svgStyle()}
        onPointerDown={e => e.preventDefault()}
        onClick={handleSurfaceClick}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={clipPath} />
          </clipPath>
        </defs>

        <path
          class={`opacity-0 transition-opacity duration-[250ms] ease-in-out ${focused() ? 'opacity-[0.28]' : ''}`}
          d={bandPath}
          fill="none"
          stroke={accentColor()}
          stroke-width={(props.borderWidth ?? 1.5) + 6}
        />
        <path
          d={bandPath}
          fill={bgColor()}
          stroke={strokeColor()}
          stroke-width={props.borderWidth ?? 1.5}
        />

        <path id={layoutPathId} d={layoutPath} fill="none" />

        <Show when={props.showIcon ?? true}>
          <g transform={`translate(${round2(ix)} ${round2(iy)}) rotate(${round2(iconAngle)})`}>
            {props.icon || (
              <>
                <rect
                  x={-chipW / 2}
                  y={-chipH / 2}
                  width={chipW}
                  height={chipH}
                  rx={chipH * 0.27}
                  fill={chipFill}
                />
                <rect
                  x={-ew / 2}
                  y={-eh / 2}
                  width={ew}
                  height={eh}
                  rx={1.4}
                  fill="none"
                  stroke="#ffffff"
                  stroke-width={sw}
                  stroke-linejoin="round"
                />
                <path
                  d={`M ${round2(-ew / 2)} ${round2(-eh / 2 + sw * 0.4)} L 0 ${round2(eh * 0.14)} L ${round2(ew / 2)} ${round2(-eh / 2 + sw * 0.4)}`}
                  fill="none"
                  stroke="#ffffff"
                  stroke-width={sw}
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
              </>
            )}
          </g>
        </Show>

        <g clip-path={`url(#${clipId})`}>
          <text
            ref={(el: SVGTextElement) => {
              textRef = el
              // xml:space is not in Solid's SVG JSX types; set it directly.
              el.setAttribute('xml:space', 'preserve')
            }}
            style={{ 'font-size': `${props.fontSize ?? 16}px`, 'font-weight': 500 }}
            fill={fgColor()}
          >
            <textPath href={`#${layoutPathId}`}>{display()}</textPath>
          </text>
          <Show when={!display() && props.placeholder}>
            <text
              ref={(el: SVGTextElement) => el.setAttribute('xml:space', 'preserve')}
              style={{ 'font-size': `${props.fontSize ?? 16}px`, 'font-weight': 500 }}
              fill={phColor()}
            >
              <textPath href={`#${layoutPathId}`}>{props.placeholder}</textPath>
            </text>
          </Show>
          <Show when={focused()}>
            <g
              transform={`translate(${round2(caretX)} ${round2(caretY)}) rotate(${round2(caretAngle)})`}
            >
              <line
                y1={-caretH / 2}
                y2={caretH / 2}
                stroke={fgColor()}
                stroke-width="1.5"
                stroke-linecap="round"
              >
                <animate
                  attributeName="opacity"
                  values="1;0"
                  dur="1.06s"
                  calcMode="discrete"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          </Show>
        </g>

        <Show when={props.showButton ?? true}>
          <g
            class="group outline-none cursor-pointer"
            role="button"
            tabindex={0}
            aria-label={props.buttonText ?? 'Get Started'}
            onClick={e => {
              e.stopPropagation()
              handleSubmit()
            }}
            onPointerDown={(e: PointerEvent & { currentTarget: SVGGElement }) =>
              e.stopPropagation()
            }
            onKeyDown={(e: KeyboardEvent & { currentTarget: SVGGElement }) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleSubmit()
              }
            }}
          >
            <path
              class="group-active:brightness-[0.94] group-focus-visible:brightness-[1.18] group-hover:brightness-[1.12] transition-[filter,opacity] duration-200 ease-in-out"
              d={buttonPath}
              fill={accentColor()}
            />
            <path id={buttonPathId} d={buttonTextPath} fill="none" />
            <text
              fill={btnFgColor()}
              text-anchor="middle"
              style={{
                'font-size': `${props.fontSize ?? 16}px`,
                'font-weight': 600,
                'pointer-events': 'none',
              }}
            >
              <textPath href={`#${buttonPathId}`} startOffset="50%">
                {props.buttonText ?? 'Get Started'}
              </textPath>
            </text>
          </g>
        </Show>

        <text
          ref={btnMeasureRef}
          style={{ 'font-size': `${props.fontSize ?? 16}px`, 'font-weight': 600 }}
          x="-9999"
          y="-9999"
          visibility="hidden"
        >
          {props.buttonText ?? 'Get Started'}
        </text>
      </svg>
    )
  })

  return (
    <form
      ref={rootRef}
      class={`relative block w-full max-w-full m-0 ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={{
        width: typeof props.width === 'number' ? `${props.width}px` : props.width,
        ...props.style,
      }}
      onSubmit={handleSubmit}
      noValidate
    >
      {content()}
      <input
        ref={inputRef}
        class="absolute inset-0 bg-transparent opacity-0 m-0 p-0 border-0 outline-none w-full h-full text-transparent text-base pointer-events-none [caret-color:transparent]"
        type={safeType()}
        inputMode={inputMode()}
        name={props.name}
        value={val()}
        onInput={handleInputChange}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={props.ariaLabel || props.placeholder || 'Curved input'}
        autocomplete="off"
        autocapitalize="none"
        autocorrect="off"
        spellcheck={false}
      />
    </form>
  )
}

export default CurvedInput
