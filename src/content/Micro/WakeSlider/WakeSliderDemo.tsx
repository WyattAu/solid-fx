import { For } from 'solid-js';
import WakeSlider from './WakeSlider';

function WakeSliderDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 bg-zinc-950 p-10 text-white">
      <div class="w-full max-w-md">
        <p class="mb-2 text-xs tracking-widest text-zinc-500 uppercase">Volume</p>
        <WakeSlider defaultValue={64} showValue bars={36} />
      </div>
      <div class="w-full max-w-md">
        <p class="mb-2 text-xs tracking-widest text-zinc-500 uppercase">Warmth</p>
        <WakeSlider
          defaultValue={30}
          showValue
          crestColor="#fbbf24"
          fillColor="#f59e0b"
          trackColor="#3f3f46"
          formatValue={(v) => `${Math.round(v)}°`}
        />
      </div>
      <p class="text-xs text-zinc-600">
        <For each={['Drag to scrub', 'Arrow keys step', 'Flick for wake']}>{(t) => <span class="mx-2">{t}</span>}</For>
      </p>
    </div>
  );
}

export default WakeSliderDemo;
