import { createSignal } from 'solid-js';
import ElasticSlider from './ElasticSlider';

function ElasticSliderDemo() {
  const [value, setValue] = createSignal(50);
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-gray-950 text-white">
      <ElasticSlider value={value()} onChange={setValue} ariaLabel="Volume" />
      <ElasticSlider
        defaultValue={20}
        maxValue={40}
        isStepped
        stepSize={4}
        ticks
        thumb
        valuePosition="bubble"
        ariaLabel="Stepped zoom"
      />
      <p class="text-sm text-white/50">Value: {value()}</p>
    </div>
  );
}

export default ElasticSliderDemo;
