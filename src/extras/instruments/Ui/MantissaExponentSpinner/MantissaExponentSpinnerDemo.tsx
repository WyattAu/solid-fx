// solid-fx Instruments widget — original component (not a port).
import { createSignal } from 'solid-js'
import MantissaExponentSpinner from './MantissaExponentSpinner'

function MantissaExponentSpinnerDemo() {
  const [planck, setPlanck] = createSignal(6.62607015e-34)
  const [avogadro, setAvogadro] = createSignal(6.02214076e23)
  return (
    <div class="flex w-full flex-col items-start justify-center gap-6 p-6">
      <div class="flex flex-col gap-2">
        <MantissaExponentSpinner label="Planck constant" value={planck()} onChange={setPlanck} />
        <span class="font-mono text-xs text-gray-500">= {planck().toExponential(6)}</span>
      </div>
      <div class="flex flex-col gap-2">
        <MantissaExponentSpinner
          label="Avogadro (engineering)"
          value={avogadro()}
          onChange={setAvogadro}
          engineering
        />
        <span class="font-mono text-xs text-gray-500">= {avogadro().toExponential(6)}</span>
      </div>
    </div>
  )
}

export default MantissaExponentSpinnerDemo
