import WarpText from './WarpText';

function WarpTextDemo() {
  return (
    <div class="h-96 w-full bg-gray-950 p-8 text-white">
      <WarpText text="Bend the moment" color="#f8fafc" class="h-full rounded-xl" fontSize="clamp(2.5rem, 8vw, 6rem)" />
    </div>
  );
}

export default WarpTextDemo;
