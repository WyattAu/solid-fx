// solid-fx Data widget — original component (not a port).
import { mulberry32 } from '@/lib/num'
import { createSignal, onCleanup } from 'solid-js'
import FftSpectrum from './FftSpectrum'

// Demo: 2048 samples @ 8 kHz — 440 Hz + 1.046 kHz tones over dither noise,
// then a signal that toggles each second to prove the spectrum recomputes.
function makeSignal(seed: number, tone2: number): number[] {
  const rng = mulberry32(seed)
  const n = 2048
  const sr = 8000
  const out = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    out[i] =
      Math.sin(2 * Math.PI * 440 * t) +
      0.5 * Math.sin(2 * Math.PI * tone2 * t) +
      (rng() - 0.5) * 0.15
  }
  return out
}

function FftSpectrumDemo() {
  const [tone2, setTone2] = createSignal(1046)
  // flip the second partial between two frequencies every second
  const timer = setInterval(() => {
    setTone2(t => (t === 1046 ? 1568 : 1046))
  }, 1000)
  onCleanup(() => clearInterval(timer))
  return (
    <div class="flex w-full max-w-xl flex-col gap-5 p-6">
      <FftSpectrum
        label="440 Hz + alternating partial"
        signal={makeSignal(0x501, tone2())}
        sampleRate={8000}
      />
      <FftSpectrum
        label="same signal, dB scale"
        signal={makeSignal(0x501, tone2())}
        sampleRate={8000}
        decibels
        color="oklch(0.72 0.12 160)"
      />
    </div>
  )
}

export default FftSpectrumDemo
