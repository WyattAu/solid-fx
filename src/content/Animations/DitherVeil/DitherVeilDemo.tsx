import DitherVeil from './DitherVeil';

function DitherVeilDemo() {
  return (
    <div class="h-96 w-full bg-neutral-950">
      <DitherVeil src="https://picsum.photos/seed/ditherveil/900/600" pixelSize={3} revealRadius={160} />
    </div>
  );
}

export default DitherVeilDemo;
