import FlyingPosters from './FlyingPosters';

const ITEMS = [1, 2, 3, 4, 5, 6].map(n => `https://picsum.photos/seed/flyingposters-${n}/640/640`);

function FlyingPostersDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950">
      <FlyingPosters items={ITEMS} speed={0.6} planeWidth={220} planeHeight={220} gap={40} fade={0.1} />
    </div>
  );
}

export default FlyingPostersDemo;
