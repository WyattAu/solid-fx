// solid-fx scenes layer — composition, not a port.
import ExplorableScene from './ExplorableScene'

function ExplorableSceneDemo() {
  return (
    <div class="w-full bg-gray-950 py-10">
      <ExplorableScene damping={0.12} frequency={5} width={440} />
    </div>
  )
}

export default ExplorableSceneDemo
