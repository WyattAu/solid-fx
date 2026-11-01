import { createSignal } from 'solid-js';
import DodgeField from './DodgeField';

function DodgeFieldDemo() {
  const [dodges, setDodges] = createSignal(0);
  return (
    <div class="h-96 w-full bg-zinc-950 p-8 text-white">
      <DodgeField notice="Touch devices: the button surrenders." onDodge={setDodges}>
        {(state) => (
          <div class="flex flex-col items-center gap-2">
            <span class="text-sm text-zinc-400">{state.fleeing ? 'Fleeing…' : state.caught ? 'Caught!' : 'Try to catch it'}</span>
            <span class="text-xs text-zinc-500">Dodges: {dodges()}</span>
          </div>
        )}
      </DodgeField>
    </div>
  );
}

export default DodgeFieldDemo;
