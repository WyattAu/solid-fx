// Source: github.com/codse/animata animata/button/swipe-button.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream merges classes with cn() (clsx + tailwind-merge); this
// port template-joins, equivalent for the plain strings passed here.

import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

interface SwipeButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  firstText: string
  secondText: string
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  firstClass?: string
  secondClass?: string
}

export default function SwipeButton(props: SwipeButtonProps) {
  const [own, rest] = splitProps(props, [
    'firstText',
    'secondText',
    'class',
    'className',
    'firstClass',
    'secondClass',
  ])

  const firstText = () => own.firstText ?? 'Get access'
  const secondText = () => own.secondText ?? 'Get access'
  const firstClass = () => own.firstClass ?? 'bg-orange-500 text-white'
  const secondClass = () => own.secondClass ?? 'bg-black text-white'
  const common = 'block px-4 py-2 text-2xl font-bold duration-300 ease-in-out'

  return (
    <button
      type="button"
      {...rest}
      class={`group/button relative min-w-fit overflow-hidden rounded-md ${own.class ?? ''} ${
        own.className ?? ''
      }`}
    >
      <span
        class={`absolute inset-0 translate-y-full group-hover/button:translate-y-0 ${common} ${secondClass()}`}
      >
        {secondText()}
      </span>
      <span class={`group-hover/button:-translate-y-full ${common} ${firstClass()}`}>
        {firstText()}
      </span>
    </button>
  )
}
