import SwipeRow from './SwipeRow'

function SwipeRowDemo() {
  const actions = [
    { id: 'archive', label: 'Archive', color: '#22c55e' },
    { id: 'delete', label: 'Delete', color: '#ef4444' },
  ]
  return (
    <div class="w-full space-y-3 p-8">
      <SwipeRow actions={actions} height={64}>
        <div class="flex h-full items-center px-4 text-sm text-white">
          Swipe me — three rows, three fates.
        </div>
      </SwipeRow>
      <SwipeRow actions={actions} height={64}>
        <div class="flex h-full items-center px-4 text-sm text-white">Drag past the edge.</div>
      </SwipeRow>
      <SwipeRow actions={actions} height={64}>
        <div class="flex h-full items-center px-4 text-sm text-white">
          Actions fire onSelect and dismiss.
        </div>
      </SwipeRow>
    </div>
  )
}

export default SwipeRowDemo
