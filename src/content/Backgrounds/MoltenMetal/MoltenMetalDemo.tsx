import MoltenMetal from './MoltenMetal';

function MoltenMetalDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <MoltenMetal class="h-full w-full" backgroundColor="#050505" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <MoltenMetal
          class="h-full w-full"
          colors={['#ff7a18', '#af002d', '#319197']}
          coreColor="#fff7ed"
          colorMode="ember"
          backgroundColor="#0a0500"
          glow={2}
        />
      </div>
    </div>
  );
}

export default MoltenMetalDemo;
