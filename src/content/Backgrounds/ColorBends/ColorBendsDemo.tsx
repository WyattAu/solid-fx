import ColorBends from './ColorBends';

function ColorBendsDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-80 overflow-hidden rounded-2xl border border-white/10">
        <ColorBends
          class="h-full w-full"
          colors={['#4c1d95', '#c026d3', '#fb923c', '#38bdf8']}
          scale={1.1}
          warpStrength={1.2}
        />
      </div>
      <div class="h-80 overflow-hidden rounded-2xl border border-white/10">
        <ColorBends
          class="h-full w-full"
          colors={['#052e16', '#22c55e', '#a3e635']}
          speed={0.35}
          frequency={1.4}
          noise={0.2}
          autoRotate={4}
        />
      </div>
    </div>
  );
}

export default ColorBendsDemo;
