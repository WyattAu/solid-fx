// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/animated-circular-progress-bar.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { splitProps } from 'solid-js'

interface AnimatedCircularProgressBarProps {
  max?: number
  min?: number
  value?: number
  gaugePrimaryColor: string
  gaugeSecondaryColor: string
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
}

export function AnimatedCircularProgressBar(props: AnimatedCircularProgressBarProps) {
  const [own] = splitProps(props, [
    'max',
    'min',
    'value',
    'gaugePrimaryColor',
    'gaugeSecondaryColor',
    'class',
    'className',
  ])

  const max = () => own.max ?? 100
  const min = () => own.min ?? 0
  const value = () => own.value ?? 0

  const circumference = 2 * Math.PI * 45
  const percentPx = circumference / 100
  // Upstream computes this per render from props; the JSX reads keep it
  // reactive in Solid.
  const currentPercent = () => Math.round(((value() - min()) / (max() - min())) * 100)

  return (
    <div
      class={`relative size-40 text-2xl font-semibold ${own.class ?? ''} ${own.className ?? ''}`}
      style={{
        '--circle-size': '100px',
        '--circumference': `${circumference}`,
        '--percent-to-px': `${percentPx}px`,
        '--gap-percent': '5',
        '--offset-factor': '0',
        '--transition-length': '1s',
        '--transition-step': '200ms',
        '--delay': '0s',
        '--percent-to-deg': '3.6deg',
        transform: 'translateZ(0)',
      }}
    >
      <svg fill="none" class="size-full" stroke-width="2" viewBox="0 0 100 100">
        {currentPercent() <= 90 && currentPercent() >= 0 && (
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke-width="10"
            stroke-dashoffset="0"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="opacity-100"
            style={{
              stroke: own.gaugeSecondaryColor,
              '--stroke-percent': `${90 - currentPercent()}`,
              '--offset-factor-secondary': 'calc(1 - var(--offset-factor))',
              'stroke-dasharray':
                'calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)',
              transform:
                'rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)',
              transition: 'all var(--transition-length) ease var(--delay)',
              'transform-origin': 'calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)',
            }}
          />
        )}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke-width="10"
          stroke-dashoffset="0"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="opacity-100"
          style={{
            stroke: own.gaugePrimaryColor,
            '--stroke-percent': `${currentPercent()}`,
            'stroke-dasharray':
              'calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)',
            transition:
              'var(--transition-length) ease var(--delay),stroke var(--transition-length) ease var(--delay)',
            'transition-property': 'stroke-dasharray,transform',
            transform:
              'rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))',
            'transform-origin': 'calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)',
          }}
        />
      </svg>
      {/* PORT-NOTE: `animate-in fade-in` are tw-animate-css utilities; they are
          inert unless the host site includes tw-animate-css. The remaining
          classes (`delay-(--delay)`, `duration-(--transition-length)`,
          `ease-linear`) are Tailwind v4 arbitrary-var utilities compiled by the
          site theme. */}
      <span
        data-current-value={currentPercent()}
        class="animate-in fade-in absolute inset-0 m-auto size-fit delay-(--delay) duration-(--transition-length) ease-linear"
      >
        {currentPercent()}
      </span>
    </div>
  )
}

export default AnimatedCircularProgressBar
