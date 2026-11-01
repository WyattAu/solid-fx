import GlowCursor from './GlowCursor';

function GlowCursorDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-gray-950">
      <GlowCursor color="#5f8bff" quality="medium">
        <div class="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
          <h3 class="text-2xl font-semibold text-white">Fluid glow trail</h3>
          <p class="max-w-sm text-sm leading-relaxed text-white/60">
            Dye advects through a fluid simulation as the pointer moves; click anywhere for a burst.
          </p>
        </div>
      </GlowCursor>
    </div>
  );
}

export default GlowCursorDemo;
