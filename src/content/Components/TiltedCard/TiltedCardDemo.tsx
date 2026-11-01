import TiltedCard from './TiltedCard';

function TiltedCardDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-xl bg-neutral-950">
      <TiltedCard
        imageSrc="https://picsum.photos/seed/tiltedcard/400/400"
        altText="Tilted card demo"
        captionText="Hover me"
        containerHeight="280px"
        containerWidth="280px"
        imageHeight="280px"
        imageWidth="280px"
        rotateAmplitude={14}
        showTooltip
      />
    </div>
  );
}

export default TiltedCardDemo;
