import Prism from './Prism';

export default function PrismDemo() {
  return (
    <div class="h-96 w-full">
      <Prism animationType="rotate" colors={['#ff5500', '#00ccff', '#aa22ff']} glow={1} />
    </div>
  );
}
