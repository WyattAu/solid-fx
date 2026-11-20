// solid-fx Components widget — port of the Animate UI Accordion primitive
// (MIT + Commons Clause — see LICENSE-SOURCES.md), rebuilt on Kobalte
// (Solid's headless-accessibility layer) with the same animated behavior:
// the panel height glides as the trigger toggles and the chevron rotates.
// The Radix dependency of the React original becomes Kobalte — the idiomatic
// Solid equivalent.
import { Accordion as AccordionPrimitive } from '@kobalte/core'
import { For, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface AnimatedAccordionItem {
  /** Trigger label. */
  question: string
  /** Panel content. */
  answer: JSX.Element | string
}

export interface AnimatedAccordionProps {
  items: AnimatedAccordionItem[]
  /** Initially open item indexes (accordion allows multiple open). */
  defaultOpen?: number[]
  /** Accent color for the open trigger (default sky). */
  accent?: string
  /** Panel animation duration in ms (default 300). */
  duration?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const STYLE = `
.anui-acc-item { border-bottom: 1px solid oklch(0.28 0.02 250); }
.anui-acc-trigger {
  display: flex; width: 100%; align-items: center; justify-content: space-between;
  gap: 1rem; padding: 0.9rem 0.25rem; text-align: left;
  font-size: 0.925rem; font-weight: 500; color: oklch(0.9 0.01 250);
  background: none; border: none; cursor: pointer;
}
.anui-acc-trigger:hover { color: oklch(0.97 0.02 235); }
.anui-acc-trigger:focus-visible { outline: 2px solid oklch(0.72 0.12 235); outline-offset: 2px; border-radius: 4px; }
.anui-acc-trigger[data-expanded] { color: oklch(0.85 0.09 235); }
.anui-acc-chevron {
  transition: transform var(--anui-duration, 300ms) ease;
  flex-shrink: 0;
}
.anui-acc-trigger[data-expanded] .anui-acc-chevron { transform: rotate(180deg); }
.anui-acc-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--anui-duration, 300ms) ease;
}
.anui-acc-panel[data-expanded] { grid-template-rows: 1fr; }
.anui-acc-panel > div { overflow: hidden; }
.anui-acc-content { padding: 0.25rem 0.25rem 1rem; font-size: 0.875rem; line-height: 1.6; color: oklch(0.72 0.01 250); }
`

export function AnimatedAccordion(props: AnimatedAccordionProps) {
  const [own, rest] = splitProps(props, [
    'items',
    'defaultOpen',
    'accent',
    'duration',
    'label',
    'class',
    'className',
    'style',
  ])

  const duration = () => own.duration ?? 300

  return (
    <>
      <style>{STYLE}</style>
      <div
        class={`anui-acc-root w-full ${own.class ?? ''} ${own.className ?? ''}`}
        style={{ ...own.style, '--anui-duration': `${duration()}ms` } as JSX.CSSProperties}
        role="group"
        aria-label={own.label ?? 'accordion'}
      >
        <AccordionPrimitive.Root multiple defaultValue={own.defaultOpen?.map(String)}>
          <For each={own.items}>
            {(item, index) => (
              <AccordionPrimitive.Item class="anui-acc-item" value={String(index())}>
                <AccordionPrimitive.Trigger class="anui-acc-trigger" style={{ color: undefined }}>
                  {item.question}
                  <svg
                    class="anui-acc-chevron"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                    style={{ color: own.accent ?? 'oklch(0.72 0.12 235)' }}
                  >
                    <path d="M4 6 L8 10 L12 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </AccordionPrimitive.Trigger>
                <AccordionPrimitive.Content class="anui-acc-panel">
                  <div class="anui-acc-content">
                    {typeof item.answer === 'string' ? (
                      <p class="m-0">{item.answer}</p>
                    ) : (
                      item.answer
                    )}
                  </div>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            )}
          </For>
        </AccordionPrimitive.Root>
      </div>
    </>
  )
}

export default AnimatedAccordion
