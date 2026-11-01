import { createSignal, onCleanup, onMount } from 'solid-js'
import RefineFrame, { type RefineFrameStatus } from './RefineFrame'

const CYCLE: RefineFrameStatus[] = ['queued', 'generating', 'refining', 'complete']

function RefineFrameDemo() {
  const [status, setStatus] = createSignal<RefineFrameStatus>('generating')
  let step = 1
  onMount(() => {
    const id = setInterval(() => {
      step = (step + 1) % CYCLE.length
      setStatus(CYCLE[step])
    }, 2600)
    onCleanup(() => clearInterval(id))
  })
  return (
    <div class="flex h-96 w-full flex-wrap items-center justify-center gap-6 bg-gray-950 p-8 text-white">
      <RefineFrame status={status()} width={340}>
        <img src="https://picsum.photos/seed/refineframe/640/480" alt="" />
      </RefineFrame>
      <RefineFrame status="generating" width={220} aspectRatio="1 / 1" radius={24}>
        <img src="https://picsum.photos/seed/refinegrid/480/480" alt="" />
      </RefineFrame>
    </div>
  )
}

export default RefineFrameDemo
