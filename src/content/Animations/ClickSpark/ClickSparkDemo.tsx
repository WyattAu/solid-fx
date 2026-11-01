import { onCleanup, onMount } from 'solid-js';
import ClickSpark, { type ClickSparkHandle } from './ClickSpark';

function ClickSparkDemo() {
  let handle: ClickSparkHandle | null = null;

  onMount(() => {
    const id = setInterval(() => {
      handle?.spark(20 + Math.random() * 60, 20 + Math.random() * 60);
    }, 1100);
    onCleanup(() => clearInterval(id));
  });

  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950">
      <ClickSpark ref={h => (handle = h)} sparkColor={['#a78bfa', '#ffffff']} sparkSize={16} glow={0.6} ring>
        <button
          type="button"
          class="rounded-lg border border-neutral-700 px-6 py-3 text-sm text-neutral-100 hover:border-neutral-500"
        >
          Click anywhere on this card
        </button>
      </ClickSpark>
    </div>
  );
}

export default ClickSparkDemo;
