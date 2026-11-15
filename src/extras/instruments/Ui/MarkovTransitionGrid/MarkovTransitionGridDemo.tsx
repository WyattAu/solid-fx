// solid-fx Instruments widget — original component (not a port).
import MarkovTransitionGrid from './MarkovTransitionGrid'

// Demo: weather chain — sunny days persist, storms are rare and short.
function MarkovTransitionGridDemo() {
  return (
    <div class="flex w-full justify-center p-6">
      <MarkovTransitionGrid
        states={['sun', 'cloud', 'rain']}
        transition={[
          [0.8, 0.15, 0.05],
          [0.4, 0.4, 0.2],
          [0.3, 0.5, 0.2],
        ]}
      />
    </div>
  )
}

export default MarkovTransitionGridDemo
