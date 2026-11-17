// solid-fx Emergent widget — original component (not a port).
import BoidsFlocking from './BoidsFlocking'

function BoidsFlockingDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-8 p-6">
      <BoidsFlocking label="query: 'result' — pointer herds the flock" />
      <BoidsFlocking
        label="pure flocking (no attractor)"
        attractor={0}
        count={80}
        seed={0x2b}
        width={360}
        height={260}
      />
    </div>
  )
}

export default BoidsFlockingDemo
