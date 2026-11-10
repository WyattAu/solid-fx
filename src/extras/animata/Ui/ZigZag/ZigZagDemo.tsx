// Source: demo harness derived from github.com/codse/animata animata/background/zigzag.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import ZigZag from './ZigZag'

function ZigZagDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center gap-6 rounded-lg border border-gray-800 p-4">
      <ZigZag
        color="#262626"
        size={12}
        class="h-full w-1/3 overflow-hidden rounded-md"
        style={{ 'background-color': '#09090b' }}
      />
      <ZigZag color="#cacaca" size={10} class="h-full w-1/3 overflow-hidden rounded-md">
        <div class="flex h-full items-center justify-center">
          <div class="rounded bg-neutral-200 px-4 py-2 text-neutral-900">ZigZag</div>
        </div>
      </ZigZag>
      <ZigZag
        color="#d946ef"
        size={16}
        class="h-full w-1/3 overflow-hidden rounded-md"
        style={{ 'background-color': '#09090b' }}
      />
    </div>
  )
}

export default ZigZagDemo
