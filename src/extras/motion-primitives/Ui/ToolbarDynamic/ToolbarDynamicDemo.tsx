// Demo harness for the ToolbarDynamic port. Dark-stage friendly,
// self-contained. The toolbar anchors itself `absolute bottom-8`; the demo
// provides a bottom-centered relative wrapper on a dark stage.
import ToolbarDynamic from './ToolbarDynamic'

function ToolbarDynamicDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <p class="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center text-xs text-neutral-500">
        Click the search icon to expand the toolbar · click outside to close
      </p>
      <div class="absolute inset-x-0 bottom-0 flex justify-center">
        <div class="relative h-16 w-fit">
          <ToolbarDynamic />
        </div>
      </div>
    </div>
  )
}

export default ToolbarDynamicDemo
