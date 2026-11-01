import BlobCursor from './BlobCursor'

function BlobCursorDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-neutral-950">
      <p class="flex h-full items-center justify-center text-sm text-neutral-500">
        move the cursor through this box
      </p>
      <BlobCursor color="#3B82F6" trail={12} />
    </div>
  )
}

export default BlobCursorDemo
