import FadeContent from './FadeContent';

function FadeContentDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-6">
      <FadeContent
        trigger="mount"
        duration={0.9}
        blur
        class="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <h3 class="text-lg font-semibold text-white">Fade on mount</h3>
        <p class="mt-2 text-sm leading-relaxed text-white/60">
          Content sharpens from a soft blur as it fades in — scroll-triggered by default, or on mount like this
          demo. Supports dissolve, mist, and pixel masks via the <code class="text-white/80">effect</code> prop.
        </p>
      </FadeContent>
    </div>
  );
}

export default FadeContentDemo;
