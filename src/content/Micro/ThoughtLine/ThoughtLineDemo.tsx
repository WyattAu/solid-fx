import { For } from 'solid-js'
import ThoughtLine from './ThoughtLine'

interface Case {
  label: string
  glyph?: 'sparkle' | 'dot'
  steps: string[]
  settleAfter: number
  showTimer?: boolean
  doneLabel?: string
}

const CASES: Case[] = [
  {
    label: 'Thinking…',
    glyph: 'sparkle',
    steps: ['Parsing the question', 'Retrieving context', 'Drafting a response'],
    settleAfter: 6,
  },
  {
    label: 'Summarizing sources',
    glyph: 'dot',
    steps: ['Reading 12 pages', 'Extracting key claims'],
    settleAfter: 3.5,
    showTimer: false,
    doneLabel: 'Summary ready',
  },
]

function ThoughtLineDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-start justify-center gap-8 bg-gray-950 p-8 text-white">
      <For each={CASES}>
        {c => (
          <ThoughtLine
            label={c.label}
            glyph={c.glyph}
            steps={c.steps}
            settleAfter={c.settleAfter}
            showTimer={c.showTimer}
            doneLabel={c.doneLabel}
          />
        )}
      </For>
    </div>
  )
}

export default ThoughtLineDemo
