// solid-fx Instruments widget — original component (not a port).
import PhaseSpacePendulum from './PhaseSpacePendulum'

function PhaseSpacePendulumDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-8 p-6">
      <PhaseSpacePendulum label="librating pendulum (start inside the separatrix)" />
      <PhaseSpacePendulum
        label="rotating pendulum (start outside — θ wraps)"
        gravity={1.4}
        theta={0.4}
        omega={3.6}
        width={320}
        height={240}
      />
    </div>
  )
}

export default PhaseSpacePendulumDemo
