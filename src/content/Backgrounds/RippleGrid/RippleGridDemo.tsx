import RippleGrid from './RippleGrid';

export default function RippleGridDemo() {
  return (
    <div class="h-96 w-full">
      <RippleGrid color="#ffffff" variant="lines" cellSize={48} glow={0.6} tilt={24} />
    </div>
  );
}
