import ParticleText from './ParticleText';

function ParticleTextDemo() {
  return (
    <div class="h-96 w-full bg-gray-950">
      <ParticleText
        text="Solid Bits"
        color="#ffffff"
        highlightColor="#ff5a36"
        particleSize={2}
        density={4}
        intro="gather"
        className="text-white"
      />
    </div>
  );
}

export default ParticleTextDemo;
