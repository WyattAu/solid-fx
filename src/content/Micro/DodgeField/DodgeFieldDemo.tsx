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
  onMount(() => autoPointer(host, { hz: 10, roam: 0.55, clickEvery: 2600 }))
  return (
    <div ref={host} class="h-96 w-full bg-zinc-950 p-8 text-white">
      <DodgeField notice="Touch devices: the button surrenders." onDodge={setDodges}>
        {state => (
          <div class="flex flex-col items-center gap-2">
            <span class="text-sm text-zinc-400">
              {state.fleeing ? 'Fleeing…' : state.caught ? 'Caught!' : 'Try to catch it'}
            </span>
            <span class="text-xs text-zinc-500">Dodges: {dodges()}</span>
          </div>
        )}
      </DodgeField>
    </div>
  )
}

export default DodgeFieldDemo
