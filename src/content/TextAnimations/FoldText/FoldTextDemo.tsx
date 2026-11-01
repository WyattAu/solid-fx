import FoldText from './FoldText';

function FoldTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-8 text-white">
      <FoldText text="Design unfolds" trigger="mount" fontSize={72} foldStyle="paper" />
    </div>
  );
}

export default FoldTextDemo;
