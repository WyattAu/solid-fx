import PixelSwap from './PixelSwap';

function PixelSwapDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950 p-6">
      <PixelSwap
        class="w-full max-w-md rounded-2xl"
        pattern="diagonal"
        pixelSize={40}
        pixelRadius={14}
        pixelScale={0.3}
        duration={450}
        firstContent={
          <div class="flex h-full w-full items-center justify-center bg-neutral-900">
            <span class="text-xs font-medium tracking-[0.3em] text-neutral-300 uppercase">Hover to swap</span>
          </div>
        }
        secondContent={
          <img
            src="https://picsum.photos/seed/pixelswap/640/400"
            alt=""
            class="h-full w-full object-cover"
            draggable={false}
          />
        }
      />
    </div>
  );
}

export default PixelSwapDemo;
