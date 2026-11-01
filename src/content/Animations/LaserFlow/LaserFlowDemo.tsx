import LaserFlow from './LaserFlow';

function LaserFlowDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-black">
      <LaserFlow beamPosition={0.6} color="#7c5cff" intensity={2} flare={1.5} spread={1.5} />
      <div class="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm font-medium tracking-widest text-white/70 uppercase">
        Laser flow
      </div>
    </div>
  );
}

export default LaserFlowDemo;
