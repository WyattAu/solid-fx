import { For } from 'solid-js';
import TargetCursor from './TargetCursor';

const ITEMS = [
  { label: 'Get started', hint: 'Primary action' },
  { label: 'Docs', hint: 'Read the manual' },
  { label: 'GitHub', hint: 'Star us' },
  { label: 'Contact', hint: 'Say hello' }
];

function TargetCursorDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-neutral-950 text-white">
      <p class="text-sm text-white/50">Move the cursor over the targets</p>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <For each={ITEMS}>
          {item => (
            <button
              type="button"
              class="cursor-target rounded-xl border border-white/15 px-6 py-3 font-medium transition-colors hover:border-white/40"
              data-cursor-label={item.hint}
            >
              {item.label}
            </button>
          )}
        </For>
      </div>
      <TargetCursor />
    </div>
  );
}

export default TargetCursorDemo;
