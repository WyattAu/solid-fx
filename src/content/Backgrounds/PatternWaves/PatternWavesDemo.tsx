import PatternWaves from './PatternWaves';

function PatternWavesDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <PatternWaves class="h-full w-full" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <PatternWaves
          class="h-full w-full"
          preset="ocean"
          color="#7dd3fc"
          backgroundColor="#020617"
          spacing={12}
          shine={1.4}
        />
      </div>
    </div>
  );
}

export default PatternWavesDemo;
