import FloatingLines from './FloatingLines'

function FloatingLinesDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <FloatingLines class="h-full w-full" lineCount={12} lineWidth={1.2} glow={1.4} />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <FloatingLines
          class="h-full w-full"
          linesGradient={['#e945f5', '#38bdf8', '#ffffff']}
          lineCount={[14, 8, 10]}
          lineStyle="dotted"
          amplitude={1.6}
          edgeFade={0.4}
        />
      </div>
    </div>
  )
}

export default FloatingLinesDemo
