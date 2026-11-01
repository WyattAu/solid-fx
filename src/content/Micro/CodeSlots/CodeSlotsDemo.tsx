import { createSignal } from 'solid-js';
import CodeSlots from './CodeSlots';

function CodeSlotsDemo() {
  const [code, setCode] = createSignal('');
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 bg-zinc-950 p-8 text-white">
      <CodeSlots
        length={6}
        defaultValue="120455"
        status={code().length === 6 ? 'success' : 'idle'}
        onChange={setCode}
        ariaLabel="Demo code"
      />
      <span class="text-sm text-zinc-400">{code() ? `Entered: ${code()}` : 'Type digits or paste'}</span>
    </div>
  );
}

export default CodeSlotsDemo;
