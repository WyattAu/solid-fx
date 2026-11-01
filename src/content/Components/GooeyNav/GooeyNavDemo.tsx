import { createSignal } from 'solid-js'
import GooeyNav from './GooeyNav'

function GooeyNavDemo() {
  const [active, setActive] = createSignal(0)

  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-6">
      <GooeyNav
        items={[
          { label: 'Home', href: '#' },
          { label: 'Work', href: '#' },
          { label: 'About', href: '#' },
          { label: 'Contact', href: '#' },
        ]}
        activeIndex={active()}
        onChange={setActive}
        colors={['#7c3aed', '#db2777', '#0ea5e9']}
      />
    </div>
  )
}

export default GooeyNavDemo
