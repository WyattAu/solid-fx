import FaultyTerminal from './FaultyTerminal';

function FaultyTerminalDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <FaultyTerminal class="h-full w-full" tint="#39ff7a" glow={0.8} curvature={0.25} scanlineIntensity={0.35} />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <FaultyTerminal
          class="h-full w-full"
          tint="#ffb347"
          glyphs="characters"
          lightMode
          scramble={0.8}
          clickEffect="degauss"
        />
      </div>
    </div>
  );
}

export default FaultyTerminalDemo;
