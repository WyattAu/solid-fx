import { For } from 'solid-js'
import WarmTooltip, { WarmTooltipGroup } from './WarmTooltip'

function WarmTooltipDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-zinc-950 p-8 text-zinc-100">
      <WarmTooltipGroup travel={260}>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <WarmTooltip content="Copy to clipboard" shortcut="⌘C" side="top">
            <button
              type="button"
              class="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              Copy
            </button>
          </WarmTooltip>
          <WarmTooltip content="Deleted items land here" side="bottom">
            <button
              type="button"
              class="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              Trash
            </button>
          </WarmTooltip>
        </div>
      </WarmTooltipGroup>
      <For each={['Standalone', 'No group', 'Instant warm']}>
        {label => (
          <WarmTooltip content={`${label} tooltip`} side="right" showFuse>
            <button
              type="button"
              class="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
            >
              {label}
            </button>
          </WarmTooltip>
        )}
      </For>
    </div>
  )
}

export default WarmTooltipDemo
