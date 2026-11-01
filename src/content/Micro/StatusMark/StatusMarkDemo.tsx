import { For } from 'solid-js'
import StatusMark, { type StatusMarkStatus } from './StatusMark'

interface Row {
  status: StatusMarkStatus
  label: string
  progress?: number
}

const ROWS: Row[] = [
  { status: 'pending', label: 'Queued for review' },
  { status: 'running', label: 'Running checks' },
  { status: 'running', label: 'Uploading assets', progress: 0.68 },
  { status: 'done', label: 'Deployed to production' },
  { status: 'failed', label: 'Tests failed' },
  { status: 'cancelled', label: 'Release rolled back' },
]

function StatusMarkDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-start justify-center gap-4 bg-gray-950 p-8 text-white">
      <For each={ROWS}>
        {row => <StatusMark status={row.status} progress={row.progress} label={row.label} />}
      </For>
    </div>
  )
}

export default StatusMarkDemo
