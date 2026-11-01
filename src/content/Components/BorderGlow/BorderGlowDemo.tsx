import BorderGlow from './BorderGlow';

function BorderGlowDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-6">
      <BorderGlow animated borderRadius={20} class="w-full max-w-sm">
        <div class="space-y-2 p-6">
          <h3 class="text-lg font-semibold text-white">Edge-aware glow</h3>
          <p class="text-sm text-white/60">
            Move the pointer across the card — the mesh border tracks your cursor. When
            <code class="mx-1 text-white/80">animated</code>
            is set, a light sweep plays on its own.
          </p>
        </div>
      </BorderGlow>
    </div>
  );
}

export default BorderGlowDemo;
