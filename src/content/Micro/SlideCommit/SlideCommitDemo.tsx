import { createSignal } from 'solid-js';
import SlideCommit from './SlideCommit';

function SlideCommitDemo() {
  const confirm = () =>
    new Promise<void>(resolve => {
      setTimeout(resolve, 1200);
    });
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-gray-950 p-8 text-white">
      <SlideCommit label="Slide to pay" doneLabel="Paid" onConfirm={confirm} />
      <SlideCommit
        label="Slide to deploy"
        doneLabel="Deployed"
        successColor="#38bdf8"
        onConfirm={() => new Promise<void>((_, reject) => setTimeout(() => reject('build failed'), 900))}
      />
    </div>
  );
}

export default SlideCommitDemo;
