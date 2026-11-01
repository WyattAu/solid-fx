import OrbitImages from './OrbitImages';

const IMAGES = Array.from({ length: 8 }, (_, i) => `https://picsum.photos/seed/orbit-${i + 1}/200/200`);

function OrbitImagesDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-neutral-950 px-6">
      <OrbitImages
        images={IMAGES}
        shape="ellipse"
        itemSize={56}
        duration={32}
        depth={0.6}
        showPath
        altPrefix="Orbiting photo"
      />
    </div>
  );
}

export default OrbitImagesDemo;
