import CursorGrid from './CursorGrid';

function CursorGridDemo() {
  return (
    <div class="h-96 w-full bg-neutral-950">
      <CursorGrid color="#a78bfa" cellSize={48}>
        <div class="flex h-full items-center justify-center">
          <span class="text-sm text-neutral-300">move across the grid</span>
        </div>
      </CursorGrid>
    </div>
  );
}

export default CursorGridDemo;
