import DepthText from './DepthText';

function DepthTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-8 text-white">
      <DepthText text="Elevate" depthColor="#7c3aed" fontSize="clamp(3rem, 10vw, 6rem)" />
    </div>
  );
}

export default DepthTextDemo;
