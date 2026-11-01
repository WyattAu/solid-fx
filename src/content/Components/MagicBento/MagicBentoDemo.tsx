import MagicBento from './MagicBento'

function MagicBentoDemo() {
  return (
    <div class="h-[28rem] w-full overflow-hidden bg-gray-950 p-6">
      <MagicBento glowColor="#3d8bff" columns={4} rowHeight={180} />
    </div>
  )
}

export default MagicBentoDemo
