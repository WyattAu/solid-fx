import LatticeLoader from './LatticeLoader'

function LatticeLoaderDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 bg-zinc-950 p-8 text-white">
      <LatticeLoader label="Thinking" pattern="orbit" />
      <LatticeLoader status="done" doneLabel="Done in" pattern="snake" showTimer={false} />
      <LatticeLoader status="error" errorLabel="Failed after" pattern="rain" grid={4} />
    </div>
  )
}

export default LatticeLoaderDemo
