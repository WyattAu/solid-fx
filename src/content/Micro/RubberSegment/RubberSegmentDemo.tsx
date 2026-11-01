import { createSignal } from 'solid-js';
import RubberSegment from './RubberSegment';

const MODES = ['Draft', 'Review', 'Approved', 'Locked'];

function RubberSegmentDemo() {
  const [mode, setMode] = createSignal('Review');
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-gray-950 p-8 text-white">
      <RubberSegment items={MODES} value={mode()} onChange={setMode} />
      <RubberSegment
        items={['Light', 'System', 'Dark']}
        defaultValue="System"
        size="sm"
        draggable={false}
        thumbColor="#38bdf8"
      />
      <p class="text-sm text-white/60">mode: {mode()}</p>
    </div>
  );
}

export default RubberSegmentDemo;
