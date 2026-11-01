import PixelCard from './PixelCard';

function PixelCardDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-xl bg-neutral-950">
      <PixelCard variant="blue" gap={10} speed={35} glow={0.6}>
        <div class="flex flex-col items-center gap-2 text-center">
          <span class="text-2xl font-semibold text-sky-100">Pixel reveal</span>
          <span class="text-sm text-sky-200/70">Hover or tap the card</span>
        </div>
      </PixelCard>
    </div>
  );
}

export default PixelCardDemo;
