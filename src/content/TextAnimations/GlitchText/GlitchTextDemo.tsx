import GlitchText from './GlitchText';

function GlitchTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950">
      <GlitchText speed={0.5} enableShadows={true} enableOnHover={false} className="text-white">
        GLITCH
      </GlitchText>
    </div>
  );
}

export default GlitchTextDemo;
