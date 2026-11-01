import HoloCard from './HoloCard';

function HoloCardDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-6">
      <HoloCard
        image="https://picsum.photos/seed/holocard/640/904"
        backImage="https://picsum.photos/seed/holoback/640/904"
        alt="Holographic demo card"
        preset="rainbow"
        width={260}
      />
    </div>
  );
}

export default HoloCardDemo;
