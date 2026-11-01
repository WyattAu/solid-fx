import { createSignal } from 'solid-js';
import Counter from './Counter';

function CounterDemo() {
  const [value, setValue] = createSignal(42000);
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-gray-950">
      <Counter
        value={value()}
        prefix="$"
        fontSize={64}
        fontWeight={600}
        textColor="#f4f4f5"
        duration={0.9}
      />
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          onClick={() => setValue(Math.round(value() / 2))}
        >
          Halve
        </button>
        <button
          type="button"
          class="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          onClick={() => setValue(value() * 2 + 137)}
        >
          Grow
        </button>
      </div>
    </div>
  );
}

export default CounterDemo;
