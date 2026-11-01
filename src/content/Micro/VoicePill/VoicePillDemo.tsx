import { For } from 'solid-js';
import VoicePill from './VoicePill';

function VoicePillDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-zinc-950 p-8">
      <div class="flex flex-wrap items-center justify-center gap-4">
        <VoicePill ariaLabel="Dictate a message" onStart={() => {}} onStop={() => {}} />
        <VoicePill accentColor="#a5f3fc" iconColor="#67e8f9" background="#083344" shape="rounded" size={32} />
        <VoicePill
          accentColor="#fdba74"
          iconColor="#f97316"
          background="#431407"
          mode="toggle"
          waveform={false}
          showTime={false}
        />
      </div>
      <p class="text-xs text-zinc-500">
        <For each={['Press and hold to dictate', 'Slide left to cancel', 'Escape stops']}>{(t) => <span class="mx-2">{t}</span>}</For>
      </p>
    </div>
  );
}

export default VoicePillDemo;
