import DotField from './DotField';

function DotFieldDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <DotField class="h-full w-full" dotRadius={1.6} dotSpacing={12} gradientFrom="#5227FF" gradientTo="#FF9FFC" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <DotField
          class="h-full w-full"
          pattern="hex"
          dotRadius={1.2}
          gradientFrom="#22d3ee"
          gradientTo="#a3e635"
          sparkle
          waveAmplitude={18}
          glowColor="#ffffff"
          glowIntensity={1.1}
        />
      </div>
    </div>
  );
}

export default DotFieldDemo;
