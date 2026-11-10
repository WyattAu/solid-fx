// solid-fx scenes layer — composition, not a port.
import StatsScene from './StatsScene'

function StatsSceneDemo() {
  return (
    <section class="w-full px-8 py-12">
      <StatsScene
        backdrop="dots"
        stats={[
          { label: 'Ported components', value: 130, suffix: '+' },
          { label: 'React imports', value: 0 },
          { label: 'Demo coverage', value: 100, suffix: '%' },
          { label: 'Registry runtime', value: 0, suffix: 'kb' },
        ]}
      />
    </section>
  )
}

export default StatsSceneDemo
