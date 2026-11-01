import { For } from 'solid-js'
import CallChip, { type CallChipStatus } from './CallChip'

const STATES: { status: CallChipStatus; name: string; argument: string }[] = [
  { status: 'running', name: 'bash', argument: 'bun test' },
  { status: 'done', name: 'npm', argument: 'install' },
  { status: 'error', name: 'git', argument: 'push --force' },
  { status: 'idle', name: 'docker', argument: 'build .' },
]

function CallChipDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 bg-zinc-950 p-8 text-white">
      <For each={STATES}>
        {row => (
          <CallChip
            status={row.status}
            name={row.name}
            argument={row.argument}
            onRetry={() => {}}
          />
        )}
      </For>
    </div>
  )
}

export default CallChipDemo
