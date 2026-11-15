// solid-fx Instruments widget — original component (not a port).
import BarycentricMixer from './BarycentricMixer'

function BarycentricMixerDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <BarycentricMixer axes={['risk', 'yield', 'liquidity']} initial={[2, 3, 5]} />
      <BarycentricMixer
        axes={['compute', 'memory', 'i/o']}
        initial={[6, 2, 2]}
        size={200}
        colors={['oklch(0.75 0.14 85)', 'oklch(0.72 0.13 145)', 'oklch(0.7 0.13 300)']}
      />
    </div>
  )
}

export default BarycentricMixerDemo
