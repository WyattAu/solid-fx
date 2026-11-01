import CrystalizedBall from './CrystalizedBall';

function CrystalizedBallDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950">
      <div class="h-72 w-72">
        <CrystalizedBall preset="aurora" particleCount={8000} />
      </div>
    </div>
  );
}

export default CrystalizedBallDemo;
