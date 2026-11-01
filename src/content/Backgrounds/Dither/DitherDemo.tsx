import Dither from './Dither';

function DitherDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Dither class="h-full w-full" waveColor="#4c6fff" backgroundColor="#020204" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Dither
          class="h-full w-full"
          waveColor="#ff6ec7"
          backgroundColor="#12001b"
          colorNum={6}
          ditherMode="halftone"
          mouseEffect="ripple"
          pixelSize={3}
        />
      </div>
    </div>
  );
}

export default DitherDemo;
