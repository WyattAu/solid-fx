import { createSignal } from 'solid-js'
import LineSidebar from './LineSidebar'

function LineSidebarDemo() {
  const [lastClicked, setLastClicked] = createSignal('')

  return (
    <div class="flex h-96 w-full items-center justify-start overflow-hidden bg-gray-950 p-8">
      <LineSidebar
        items={['Overview', 'Components', 'Animations', 'Backgrounds', 'Showcase', 'Playground']}
        onItemClick={(_index, label) => setLastClicked(label)}
      />
      <span class="sr-only">{`Last clicked: ${lastClicked()}`}</span>
    </div>
  )
}

export default LineSidebarDemo
