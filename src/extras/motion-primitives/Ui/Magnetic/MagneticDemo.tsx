// Source: github.com/ibelick/motion-primitives app/docs/magnetic/magnetic-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import Magnetic from './Magnetic'

function MagneticDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-6">
      <Magnetic>
        <button
          type="button"
          class="inline-flex items-center rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm text-zinc-100 transition-all duration-300 hover:bg-zinc-800"
        >
          <span>Submit</span>
        </button>
      </Magnetic>
    </div>
  )
}

export default MagneticDemo
