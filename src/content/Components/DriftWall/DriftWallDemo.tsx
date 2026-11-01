import DriftWall from './DriftWall';

function DriftWallDemo() {
  return (
    <div class="h-[480px] w-full p-4">
      <DriftWall
        class="h-full w-full overflow-hidden rounded-2xl border border-white/10"
        columns={5}
        tilt={14}
        turn={-12}
      />
    </div>
  );
}

export default DriftWallDemo;
