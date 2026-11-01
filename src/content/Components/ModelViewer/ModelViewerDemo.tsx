import ModelViewer from './ModelViewer';

// Self-contained demo: an octahedron OBJ embedded as a data URL so the smoke
// test never touches the network.
const OBJ = [
  'v 0 1.1 0',
  'v 1.1 0 0',
  'v 0 0 1.1',
  'v -1.1 0 0',
  'v 0 0 -1.1',
  'v 0 -1.1 0',
  'f 1 2 3',
  'f 1 3 4',
  'f 1 4 5',
  'f 1 5 2',
  'f 6 3 2',
  'f 6 4 3',
  'f 6 5 4',
  'f 6 2 5'
].join('\n');
const URL = `data:model/obj,${encodeURIComponent(OBJ)}`;

function ModelViewerDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950">
      <ModelViewer url={URL} width={320} height={320} autoRotate intro="rise" float={0.3} />
    </div>
  );
}

export default ModelViewerDemo;
