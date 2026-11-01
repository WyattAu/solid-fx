import FlipCard from './FlipCard';

function FlipCardDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-zinc-950 p-8 text-white">
      <FlipCard
        width={260}
        height={340}
        front={
          <div class="flex h-full w-full flex-col items-center justify-center gap-2">
            <span class="text-4xl font-semibold">Front</span>
            <span class="text-sm text-zinc-400">Click or drag to flip</span>
          </div>
        }
        back={
          <div class="flex h-full w-full flex-col items-center justify-center gap-2">
            <span class="text-4xl font-semibold">Back</span>
            <span class="text-sm text-zinc-400">Click or drag to flip back</span>
          </div>
        }
      />
    </div>
  );
}

export default FlipCardDemo;
