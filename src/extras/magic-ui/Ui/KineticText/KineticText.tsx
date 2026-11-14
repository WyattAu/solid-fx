// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/kinetic-text.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.

import { Dynamic } from 'solid-js/web'
import type { JSX } from 'solid-js'
import { For, splitProps } from 'solid-js'

type As = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'

export interface KineticTextProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, 'children' | 'style'> {
  text: string
  as?: As
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  style?: JSX.CSSProperties
}

// Upstream drives the weight/stroke swell per letter purely through Tailwind
// arbitrary classes (`hover:`, sibling `[:hover+&]:` and `has-[+span:hover]:`
// variants) — no JS state, so the port keeps the class strings verbatim and
// swaps only the framework layer.
const LETTER_CLASS =
  '[will-change:font-weight,-webkit-text-stroke-width,padding] ' +
  '[-webkit-text-stroke-color:transparent] ' +
  '[-webkit-text-stroke-width:var(--text-stroke-width)] ' +
  '[transition:font-weight_0.4s,_-webkit-text-stroke-color_0.4s,_padding_0.4s] ' +
  'hover:[padding-inline:var(--hover-padding)] ' +
  'hover:font-[900] ' +
  'hover:[-webkit-text-stroke-color:currentcolor] ' +
  'hover:[-webkit-text-stroke-width:calc(var(--text-stroke-width)*2)] ' +
  'has-[+span+span:hover]:font-[400] ' +
  'has-[+span:hover]:[padding-inline:var(--hover-padding)] ' +
  'has-[+span:hover]:font-[600] ' +
  '[:hover+&]:[padding-inline:var(--hover-padding)] ' +
  '[:hover+&]:font-[600] ' +
  '[:hover+span+&]:font-[400]'

export function KineticText(props: KineticTextProps) {
  const [own, rest] = splitProps(props, [
    'text',
    'as',
    'class',
    'className',
    'style',
  ])

  const tag = () => own.as ?? 'h1'

  // Upstream merges a plain object style with React.CSSProperties custom
  // properties; hyphenated custom property keys are valid in Solid too.
  const mergedStyle = () => ({
    '--hover-padding': 'calc(1em / 12)',
    '--text-stroke-width': 'calc(1em * 125 / 6000)',
    ...own.style,
  })

  return (
    <Dynamic
      component={tag()}
      {...rest}
      class={`flex flex-wrap font-[300] ${own.class ?? ''} ${own.className ?? ''}`}
      style={mergedStyle()}
    >
      <For each={own.text.split('')}>
        {(letter) => (
          <span aria-hidden="true" class={LETTER_CLASS}>
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        )}
      </For>
      <span class="sr-only">{own.text}</span>
    </Dynamic>
  )
}

export default KineticText
