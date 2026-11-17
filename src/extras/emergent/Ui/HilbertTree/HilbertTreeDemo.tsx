// solid-fx Emergent widget — original component (not a port).
import HilbertTree, { type HilbertTreeNode } from './HilbertTree'

// a synthetic trace tree: compile units → files → functions, weights = hot-path mass
function makeTrace(): HilbertTreeNode {
  return {
    label: 'trace',
    weight: 1000,
    children: [
      {
        label: 'compiler',
        weight: 420,
        children: [
          {
            label: 'parse',
            weight: 150,
            children: [
              { label: 'lexer', weight: 60 },
              { label: 'grammar', weight: 70 },
            ],
          },
          {
            label: 'typecheck',
            weight: 170,
            children: [
              { label: 'infer', weight: 90 },
              { label: 'unify', weight: 60 },
            ],
          },
          { label: 'codegen', weight: 100 },
        ],
      },
      {
        label: 'runtime',
        weight: 380,
        children: [
          { label: 'gc', weight: 120 },
          {
            label: 'scheduler',
            weight: 140,
            children: [
              { label: 'steal', weight: 70 },
              { label: 'queue', weight: 50 },
            ],
          },
          { label: 'ffi', weight: 90 },
        ],
      },
      {
        label: 'stdlib',
        weight: 200,
        children: [
          { label: 'collections', weight: 110 },
          { label: 'io', weight: 90, children: [{ label: 'poll', weight: 60 }] },
        ],
      },
    ],
  }
}

function HilbertTreeDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <HilbertTree root={makeTrace()} label="hot-path trace (order 6)" />
      <HilbertTree root={makeTrace()} label="same tree, order 5 (coarser)" order={5} cell={7} />
    </div>
  )
}

export default HilbertTreeDemo
