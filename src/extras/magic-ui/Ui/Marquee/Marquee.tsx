// Source: github.com/magicuidesign/magic-ui apps/www/registry/magicui/marquee.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import { splitProps, Index } from 'solid-js'
import type { JSX } from 'solid-js'

interface MarqueeProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number
}

// PORT-NOTE: upstream ships the animation utilities through the Tailwind
// theme (`animate-marquee: marquee var(--duration) infinite linear`, plus the
// two keyframes in the registry CSS). They are embedded here so the port is
// self-contained without touching the site's Tailwind theme.
const STYLE = `
@keyframes marquee {
  from { transform: translateX(0) }
  to { transform: translateX(calc(-100% - var(--gap))) }
}
@keyframes marquee-vertical {
  from { transform: translateY(0) }
  to { transform: translateY(calc(-100% - var(--gap))) }
}
.animate-marquee {
  animation: marquee var(--duration, 40s) infinite linear;
}
.animate-marquee-vertical {
  animation: marquee-vertical var(--duration, 40s) linear infinite;
}
`

export function Marquee(props: MarqueeProps) {
  const [own, rest] = splitProps(props, [
    'class',
    'className',
    'reverse',
    'pauseOnHover',
    'vertical',
    'repeat',
    'children',
  ])

  const reverse = () => own.reverse ?? false
  const pauseOnHover = () => own.pauseOnHover ?? false
  const vertical = () => own.vertical ?? false
  const repeat = () => own.repeat ?? 4

  return (
    <div
      {...rest}
      class={`group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem] ${own.class ?? ''} ${own.className ?? ''}`}
      classList={{
        'flex-row': !vertical(),
        'flex-col': vertical(),
      }}
    >
      <style>{STYLE}</style>
      <Index each={Array.from({ length: repeat() })}>
        {() => (
          <div
            class="flex shrink-0 justify-around gap-(--gap)"
            classList={{
              'animate-marquee flex-row': !vertical(),
              'animate-marquee-vertical flex-col': vertical(),
              'group-hover:[animation-play-state:paused]': pauseOnHover(),
              '[animation-direction:reverse]': reverse(),
            }}
          >
            {own.children}
          </div>
        )}
      </Index>
    </div>
  )
}

export default Marquee
