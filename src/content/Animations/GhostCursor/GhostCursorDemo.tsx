import GhostCursor from './GhostCursor';

function GhostCursorDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-gray-950">
      <div class="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <h3 class="text-2xl font-semibold text-white">Ghost cursor smoke</h3>
        <p class="max-w-sm text-sm leading-relaxed text-white/60">
          Move the pointer across this panel — a wisp of smoke trails behind it, curls with turbulence, and puffs
          on click. An intro sweep plays on load.
        </p>
      </div>
      <GhostCursor color="#B497CF" />
    </div>
  );
}

export default GhostCursorDemo;
