import { createSignal, onMount } from 'solid-js'
import DodgeField from './DodgeField'
import { autoPointer } from '@/lib/syntheticPointer'

function DodgeFieldDemo() {
  const [dodges, setDodges] = createSignal(0)
  let host!: HTMLDivElement
  // PORTING.md §6: look alive without interaction — synthesize a pointer
  // sweeping past the flee radius (roam 0.55 re-arms the dodge counter each
  // pass, so the mover never settles into the terminal "relented" pose) and a
  // periodic click so the relent → caught → reset cycle keeps looping.
  // autoPointer rate-limits moves to >=100ms internally (main-thread guard).
  // Capture visibility: the field fills the frame (320 of the 384px host) and
  // the mover is a large high-contrast card, so the ±90px dodge registers in
  // screenshot crops (CI variance gate std > 6) instead of two dim text
  // lines. The field is centered on the host, so the roam path stays inside
  // the flee radius and the dodge never leaves the field.
  onMount(() => autoPointer(host, { hz: 10, roam: 0.55, clickEvery: 2600 }))
  return (
    <div ref={host} class="h-96 w-full bg-zinc-950 p-8 text-white">
      <DodgeField
        fieldHeight={320}
        reach={90}
        notice="Touch devices: the button surrenders."
        onDodge={setDodges}
      >
        {state => (
          <div class="flex h-24 w-64 flex-col items-center justify-center gap-1 rounded-2xl bg-white text-zinc-950 shadow-xl">
            <span class="text-2xl font-bold tracking-tight">
              {state.fleeing ? 'Fleeing…' : state.caught ? 'Caught!' : 'Try to catch it'}
            </span>
            <span class="text-sm text-zinc-500">Dodges: {dodges()}</span>
          </div>
        )}
      </DodgeField>
    </div>
  )
}

export default DodgeFieldDemo
