// solid-fx Instruments widget — original component (not a port).
import HarmonicMixer from './HarmonicMixer'

function HarmonicMixerDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <HarmonicMixer label="clarinet-ish (odd partials)" amplitudes={[1, 0, 0.5, 0, 0.33, 0, 0.25, 0]} />
      <HarmonicMixer label="sawtooth-ish (1/k rolloff)" width={300} height={80} />
    </div>
  )
}

export default HarmonicMixerDemo
