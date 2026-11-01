import { createSignal, For } from 'solid-js';
import PromptBar from './PromptBar';

function PromptBarDemo() {
  const [sent, setSent] = createSignal('');
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 bg-gray-950 p-8 text-white">
      <PromptBar
        onSend={text => setSent(text)}
        onAttach={() => 'screenshot.png'}
        busy={false}
      />
      <For each={[sent()]}>
        {(msg) => (msg ? <p class="text-xs text-white/50">sent: {msg}</p> : null)}
      </For>
    </div>
  );
}

export default PromptBarDemo;
