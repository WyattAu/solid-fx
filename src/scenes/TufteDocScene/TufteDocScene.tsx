// solid-fx scenes layer — composition, not a port.
// TufteDocScene: sidenote-first article grammar. Notes, micro-charts and
// counter-arguments live in a right-hand margin rail aligned to their
// anchor line — no footnotes at the bottom, no modals, no accordions.
// Below 720px container width the rail collapses inline.
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import SparklineText from '@/extras/data/Ui/SparklineText/SparklineText'

export interface Sidenote {
  /** Number rendered in the margin. */
  n: number
  /** Sidenote body (text or small markup). */
  body: JSX.Element | string
}

export interface TufteDocSceneProps {
  title: string
  subtitle?: string
  /** Paragraphs; a string is prose, an object renders a numbered sidenote. */
  blocks: Array<string | Sidenote>
  class?: string
  style?: JSX.CSSProperties
}

const CSS = `
.tufte-wrap { container-type: inline-size; }
.tufte-article {
  max-width: 46rem;
  padding-right: 17rem;
  font-size: 1.05rem;
  line-height: 1.75;
}
.tufte-note {
  float: right;
  clear: right;
  width: 13.5rem;
  margin-right: -17.5rem;
  margin-top: 0.15rem;
  margin-bottom: 0.8rem;
  font-size: 0.82rem;
  line-height: 1.5;
  color: oklch(0.72 0.02 250);
  border-top: 1px solid oklch(0.3 0.02 250);
  padding-top: 0.35rem;
}
.tufte-note-num { font-family: ui-monospace, monospace; color: oklch(0.65 0.12 85); margin-right: 0.35rem; }
@container (max-width: 719px) {
  .tufte-article { padding-right: 0; }
  .tufte-note {
    float: none;
    width: auto;
    margin: 0.6rem 0;
    padding: 0.4rem 0.7rem;
    border-left: 2px solid oklch(0.35 0.03 85);
    border-top: none;
    background: oklch(0.2 0.01 250);
  }
}
`

export function TufteDocScene(props: TufteDocSceneProps) {
  return (
    <div class={`tufte-wrap w-full ${props.class ?? ''}`} style={props.style}>
      <style>{CSS}</style>
      <article class="tufte-article mx-auto text-gray-200">
        <header class="mb-8 border-b border-gray-800 pb-4">
          <h1 class="text-3xl font-semibold tracking-tight text-gray-50">{props.title}</h1>
          {props.subtitle && <p class="mt-1.5 text-sm text-gray-400">{props.subtitle}</p>}
        </header>
        <For each={props.blocks}>
          {block => {
            if (typeof block === 'string') {
              return <p class="mb-5">{block}</p>
            }
            return (
              <aside class="tufte-note">
                <span class="tufte-note-num">{block.n}</span>
                {block.body}
              </aside>
            )
          }}
        </For>
      </article>
    </div>
  )
}

export default TufteDocScene
