import HoldButton from './HoldButton';

function HoldButtonDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-zinc-950 p-8 text-white">
      <HoldButton holdTime={1600} onHold={() => console.log('held!')} />
      <HoldButton size="lg" fillColor="#ef4444" doneLabel="Everything gone" holdTime={1200} />
    </div>
  );
}

export default HoldButtonDemo;
