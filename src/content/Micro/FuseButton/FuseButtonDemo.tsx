import FuseButton from './FuseButton';

function FuseButtonDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-zinc-950 p-8 text-white">
      <FuseButton
        label="Archive"
        undoLabel="Undo"
        doneLabel="Archived"
        onCommit={reason => console.log('committed:', reason)}
      />
      <FuseButton
        label="Delete draft"
        undoLabel="Keep it"
        doneLabel="Deleted"
        fuse="bottom"
        fuseThickness={3}
        fuseColor="#ef4444"
        commitOn="fuseEnd"
        settle="stay"
      />
    </div>
  );
}

export default FuseButtonDemo;
