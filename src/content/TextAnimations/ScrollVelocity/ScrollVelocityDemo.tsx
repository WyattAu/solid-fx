import ScrollVelocity from './ScrollVelocity';

function ScrollVelocityDemo() {
  return (
    <div class="flex h-96 w-full flex-col justify-center gap-6 overflow-hidden bg-gray-950">
      <ScrollVelocity
        texts={['Solid Bits', 'Scroll Faster']}
        velocity={50}
        numCopies={4}
        className="text-white"
      />
      <ScrollVelocity
        texts={['Drag Me', 'Fling Me']}
        velocity={70}
        numCopies={4}
        draggable
        className="text-white/70"
      />
    </div>
  );
}

export default ScrollVelocityDemo;
