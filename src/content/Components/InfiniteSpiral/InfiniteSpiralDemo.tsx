import InfiniteSpiral from './InfiniteSpiral';

function InfiniteSpiralDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950">
      <InfiniteSpiral
        items={[1, 2, 3, 4, 5, 6, 7, 8].map(n => `https://picsum.photos/seed/spiral-${n}/200/200`)}
        speed={0.55}
        cardWidth={110}
        cardHeight={110}
      />
    </div>
  );
}

export default InfiniteSpiralDemo;
