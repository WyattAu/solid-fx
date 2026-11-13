// Source: github.com/codse/animata animata/button/slide-arrow-button.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream's lucide-react <ArrowRight size={20} /> is replaced with
// an inline SVG carrying the identical lucide arrow-right path (same viewBox,
// stroke-width, and line caps) — lucide-react is not a dependency in this repo.

import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

interface SlideArrowButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The text to display on the button.
   */
  text?: string

  /**
   * The color of the sliding overlay.
   */
  primaryColor?: string

  /** React parity alias; merges with `class`. */
  className?: string
}

export default function SlideArrowButton(props: SlideArrowButtonProps) {
  const [own, rest] = splitProps(props, ['text', 'primaryColor', 'class', 'className'])
  const text = () => own.text ?? 'Get Started'
  const primaryColor = () => own.primaryColor ?? '#6f3cff'

  return (
    <button
      type="button"
      {...rest}
      class={`group/slide relative rounded-full border border-white bg-white p-2 text-xl font-semibold ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <div
        class="absolute left-0 top-0 flex h-full w-11 items-center justify-end rounded-full transition-all duration-200 ease-in-out group-hover/slide:w-full"
        style={{ 'background-color': primaryColor() }}
      >
        <span class="mr-3 text-white transition-all duration-200 ease-in-out">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </div>
      <span class="relative left-4 z-10 whitespace-nowrap px-8 font-semibold text-black transition-all duration-200 ease-in-out group-hover/slide:-left-3 group-hover/slide:text-white">
        {text()}
      </span>
    </button>
  )
}
