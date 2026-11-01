import Noise from './Noise';

function NoiseDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-neutral-900">
      <div class="flex h-full items-center justify-center">
        <p class="max-w-md text-center text-lg text-white/80">
          A film-grain overlay with dust, scratches and scanlines — all in one component.
        </p>
      </div>
      <Noise
        opacity={0.28}
        blendMode="overlay"
        dust={0.55}
        scratches={0.4}
        scanlines={0.35}
        flicker={0.15}
        fps={24}
      />
    </div>
  );
}

export default NoiseDemo;
