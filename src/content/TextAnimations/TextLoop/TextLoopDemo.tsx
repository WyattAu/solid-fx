import TextLoop from './TextLoop'

function TextLoopDemo() {
  return (
    <div class="flex h-96 w-full items-center overflow-hidden bg-gray-950">
      <TextLoop
        text="Solid ✦ Bits"
        shape="wave"
        speed={90}
        fontSize={44}
        draggable
        ribbonColor="#5227FF"
        class="text-white"
      />
    </div>
  )
}

export default TextLoopDemo
