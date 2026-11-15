// solid-fx scenes layer — composition, not a port.
import ZeroClsScene from './ZeroClsScene'

function ZeroClsSceneDemo() {
  return (
    <div class="w-full bg-gray-950 py-10">
      <div class="mx-auto max-w-3xl px-6">
        <ZeroClsScene headline="Paint once. Paint final." heroAspect="16 / 9" />
      </div>
    </div>
  )
}

export default ZeroClsSceneDemo
