import FolderFloat from './FolderFloat'

function FolderFloatDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-zinc-950 p-8 text-white">
      <div class="pt-40">
        <FolderFloat
          onSelect={value => console.log('selected:', value)}
          label="Design feedback"
          sublabel="4 notes"
        />
      </div>
    </div>
  )
}

export default FolderFloatDemo
