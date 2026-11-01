import { createSignal } from 'solid-js'
import Dock from './Dock'
import type { DockItemData } from './Dock'

const ITEMS: DockItemData[] = [
  { icon: <span class="text-2xl">📁</span>, label: 'Files' },
  { icon: <span class="text-2xl">✉️</span>, label: 'Mail', badge: 3, active: true },
  {
    icon: <span class="text-2xl">⚙️</span>,
    label: 'Settings',
    menu: [
      { label: 'Appearance', shortcut: '⌘,' },
      { separator: true },
      { label: 'Light theme', checked: false },
      { label: 'Dark theme', checked: true },
      { separator: true },
      { label: 'Reset', disabled: true },
    ],
  },
  { separator: true },
  { icon: <span class="text-2xl">🗑️</span>, label: 'Trash' },
]

function DockDemo() {
  const [last, setLast] = createSignal('')
  return (
    <div class="relative h-96 w-full overflow-hidden bg-gray-950">
      <Dock
        items={ITEMS.map(item => ({
          ...item,
          onClick: item.onClick ?? (() => setLast(item.label ?? '')),
        }))}
        badgeColor="#ff453a"
      />
      <p class="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/50">
        {last() ? `Opened ${last()}` : 'Hover to magnify, long-press Settings for its menu'}
      </p>
    </div>
  )
}

export default DockDemo
