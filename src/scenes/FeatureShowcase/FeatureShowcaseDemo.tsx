import FeatureShowcase from './FeatureShowcase'
import { SparkleIcon, WandIcon, CpuIcon } from '@hugeicons/core-free-icons'

function FeatureShowcaseDemo() {
  return (
    <section
      class="w-full px-8 py-12"
      style={{
        background: 'linear-gradient(135deg, #05060f 0%, #1e1b4b 35%, #7c3aed 70%, #db2777 100%)',
      }}
    >
      <FeatureShowcase
        columns={3}
        features={[
          {
            title: 'Shader-backed',
            description:
              'WebGL and canvas effects with full disposal discipline — Aurora, FluidGlass, Particles and friends.',
            icon: SparkleIcon,
          },
          {
            title: 'Source you own',
            description:
              'Every component installs as plain SolidJS + TypeScript source. No registry, no wrapper runtime.',
            icon: WandIcon,
            iconColor: '#c4b5fd',
          },
          {
            title: 'Ported 1:1',
            description:
              'Same props, same defaults, same visuals as the react-bits originals — drop-in replacements.',
            icon: CpuIcon,
            iconColor: '#6ee7b7',
          },
        ]}
      />
    </section>
  )
}

export default FeatureShowcaseDemo
