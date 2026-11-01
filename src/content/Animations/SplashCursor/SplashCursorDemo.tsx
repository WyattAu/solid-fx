import SplashCursor from './SplashCursor';

function SplashCursorDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-xl bg-neutral-950">
      <SplashCursor contained quality="low" colors={['#7c5cff', '#2dd4bf', '#ffd166']} />
      <div class="pointer-events-none relative z-10 flex h-full items-center justify-center">
        <span class="text-xs font-medium tracking-[0.3em] text-white/60 uppercase">Move through the ink</span>
      </div>
    </div>
  );
}

export default SplashCursorDemo;
