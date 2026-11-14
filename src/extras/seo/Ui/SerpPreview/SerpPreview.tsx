// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props; widths measured via canvas).

import type { JSX } from 'solid-js'
import { createSignal, For, Show } from 'solid-js'

export interface SerpPreviewProps {
  /** Initial page title (Google truncates around 580px at 20px Arial). */
  title?: string
  /** Initial meta description (truncates around 990px at 14px Arial). */
  description?: string
  /** Initial display URL (e.g. docs.example.com/guides/seo). */
  url?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const TITLE_BUDGET_PX = 580
const DESCRIPTION_BUDGET_PX = 990

const measure = (text: string, font: string): number => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return text.length * 8
  context.font = font
  return context.measureText(text).width
}

const SerpPreview = (props: SerpPreviewProps) => {
  const [title, setTitle] = createSignal(props.title ?? 'The complete guide to structured data')
  const [description, setDescription] = createSignal(
    props.description ??
      'Learn how to ship valid JSON-LD on every page, validate it, and keep it in sync with the content the crawler actually sees.',
  )
  const [url, setUrl] = createSignal(props.url ?? 'docs.example.com/guides/structured-data')

  const host = () => url().split('/')[0] ?? url()
  const crumbs = () => {
    const segments = url().split('/').filter(Boolean)
    return segments.join(' › ')
  }

  const titleWidth = () => measure(title(), '20px Arial')
  const descriptionWidth = () => measure(description(), '14px Arial')

  const clipped = (text: string, width: number, font: string) => {
    if (measure(text, font) <= width) return text
    let out = text
    while (out.length > 1 && measure(`${out}...`, font) > width) {
      out = out.slice(0, -1)
    }
    return `${out.trimEnd()}...`
  }

  return (
    <div
      class={`flex h-full w-full flex-col gap-3 ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    >
      <div class="grid grid-cols-1 gap-2">
        <label class="grid gap-1">
          <span class="font-mono text-xs text-gray-400">
            title{' '}
            <Show when={titleWidth() > TITLE_BUDGET_PX}>
              <span class="text-amber-400">
                ({Math.round(titleWidth())}px &gt; {TITLE_BUDGET_PX}px)
              </span>
            </Show>
          </span>
          <input
            type="text"
            value={title()}
            onInput={e => setTitle(e.currentTarget.value)}
            class="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-emerald-500"
          />
        </label>
        <label class="grid gap-1">
          <span class="font-mono text-xs text-gray-400">
            description{' '}
            <Show when={descriptionWidth() > DESCRIPTION_BUDGET_PX}>
              <span class="text-amber-400">
                ({Math.round(descriptionWidth())}px &gt; {DESCRIPTION_BUDGET_PX}px)
              </span>
            </Show>
          </span>
          <textarea
            value={description()}
            onInput={e => setDescription(e.currentTarget.value)}
            rows={3}
            class="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-emerald-500"
          />
        </label>
        <label class="grid gap-1">
          <span class="font-mono text-xs text-gray-400">url</span>
          <input
            type="text"
            value={url()}
            onInput={e => setUrl(e.currentTarget.value)}
            class="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto rounded-lg bg-white p-4">
        <div class="mb-1 flex items-center gap-2">
          <span class="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-[10px] font-bold text-gray-600">
            {host().charAt(0).toUpperCase()}
          </span>
          <span class="text-sm text-[#202124]">{host()}</span>
          <span class="text-sm text-[#4d5156]">› {crumbs()}</span>
        </div>
        <p class="cursor-pointer text-[20px] leading-snug text-[#1a0dab] hover:underline">
          {clipped(title(), TITLE_BUDGET_PX, '20px Arial')}
        </p>
        <p class="mt-1 text-sm leading-snug text-[#4d5156]">
          <span class="text-[#202124]">Nov 13, 2026 — </span>
          {clipped(description(), DESCRIPTION_BUDGET_PX, '14px Arial')}
        </p>
      </div>
    </div>
  )
}

export default SerpPreview
