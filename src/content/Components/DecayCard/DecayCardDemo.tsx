import DecayCard from './DecayCard';

const DecayCardDemo = () => (
  <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-[#0d0b12]">
    <DecayCard
      image="https://picsum.photos/seed/decaycard/600/750"
      width={280}
      height={350}
      intensity={0.6}
      idle={0.35}
    >
      <h3 class="text-xl font-semibold">Decay</h3>
      <p class="mt-1 text-sm text-white/70">Move your cursor — the image decays with motion.</p>
    </DecayCard>
  </div>
);

export default DecayCardDemo;
