import GridMotion from './GridMotion'

function GridMotionDemo() {
  const items = [
    'GLM',
    { src: 'https://picsum.photos/seed/grid-motion-1/300/300', alt: 'tile' },
    'Solid',
    { src: 'https://picsum.photos/seed/grid-motion-2/300/300', alt: 'tile' },
    '★',
    { src: 'https://picsum.photos/seed/grid-motion-3/300/300', alt: 'tile' },
    'Bits',
    { src: 'https://picsum.photos/seed/grid-motion-4/300/300', alt: 'tile' },
  ]
  return (
    <div class="h-[480px] w-full p-4">
      <GridMotion
        items={items}
        class="h-full w-full overflow-hidden rounded-2xl border border-white/10"
        rows={4}
      />
    </div>
  )
}

export default GridMotionDemo
