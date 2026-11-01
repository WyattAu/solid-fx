import PaperCrumple from './PaperCrumple'

function PaperCrumpleDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-zinc-950 p-8 text-white">
      <PaperCrumple
        class="max-w-md"
        src="https://picsum.photos/seed/papercrumple/320/400"
        alt="A crumplable photo"
        sceneHeight={384}
      />
    </div>
  )
}

export default PaperCrumpleDemo
