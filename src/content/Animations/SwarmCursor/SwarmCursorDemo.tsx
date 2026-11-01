import SwarmCursor from './SwarmCursor';

function SwarmCursorDemo() {
  return (
    <div class="h-96 w-full">
      <SwarmCursor
        class="h-full w-full rounded-xl bg-neutral-950"
        count={700}
        color="#a5b4fc"
        accentColor="#f0abfc"
        spread={80}
      >
        <div class="flex h-full items-center justify-center">
          <button
            type="button"
            class="rounded-lg border border-neutral-700 px-6 py-3 text-sm text-neutral-100 hover:border-neutral-500"
          >
            Move the swarm around
          </button>
        </div>
      </SwarmCursor>
    </div>
  );
}

export default SwarmCursorDemo;
