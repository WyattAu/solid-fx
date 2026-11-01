import CurvedLoop from './CurvedLoop'

function CurvedLoopDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950 text-white">
      <CurvedLoop
        marqueeText="Solid bits — ported loop "
        curveAmount={320}
        fontSize={84}
        interactive
        edgeFade={0.3}
      />
    </div>
  )
}

export default CurvedLoopDemo
