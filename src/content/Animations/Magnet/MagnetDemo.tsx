import Magnet from './Magnet';

function MagnetDemo() {
  return (
    <div class="flex h-96 w-full flex-wrap items-center justify-center gap-6 bg-neutral-950 p-8">
      <Magnet padding={80} magnetStrength={3} tilt={8} scale={1.1}>
        <div class="rounded-xl bg-indigo-500 px-6 py-4 font-semibold text-white">Pull me</div>
      </Magnet>
      <Magnet padding={80} magnetStrength={4} tilt={12}>
        <div class="rounded-xl bg-neutral-800 px-6 py-4 font-semibold text-white ring-1 ring-white/15">Me too</div>
      </Magnet>
      <Magnet padding={80} magnetStrength={2.5} scale={1.15}>
        <div class="rounded-xl bg-fuchsia-500 px-6 py-4 font-semibold text-white">Springs!</div>
      </Magnet>
    </div>
  );
}

export default MagnetDemo;
