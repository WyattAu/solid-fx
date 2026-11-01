import DotGrid from './DotGrid';

function DotGridDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-2xl border border-white/10 bg-gray-950">
      <DotGrid
        gap={24}
        dotSize={5}
        baseColor="#2f2b3d"
        activeColor="#d9bcff"
        proximity={160}
        glow={0.7}
      />
      <div class="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40">
        move your pointer across the grid
      </div>
    </div>
  );
}

export default DotGridDemo;
