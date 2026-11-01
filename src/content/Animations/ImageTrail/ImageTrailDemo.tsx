import ImageTrail from './ImageTrail';

const IMAGES = Array.from({ length: 10 }, (_, i) => `https://picsum.photos/seed/imagetrail-${i + 1}/320/290`);

function ImageTrailDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-neutral-950">
      <ImageTrail items={IMAGES} size={190} aspectRatio={1.1} radius={16} tilt={8} drift={0.6} flash={0.3} />
    </div>
  );
}

export default ImageTrailDemo;
