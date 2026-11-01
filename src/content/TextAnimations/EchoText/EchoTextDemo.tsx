import EchoText from './EchoText';

function EchoTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-8 text-white">
      <EchoText text="Motion Echo" tint="#7dd3fc" echoes={12} fontSize="clamp(2.5rem, 8vw, 5rem)" />
    </div>
  );
}

export default EchoTextDemo;
