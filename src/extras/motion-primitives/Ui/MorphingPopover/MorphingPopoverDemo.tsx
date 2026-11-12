// Demo harness for the MorphingPopover port. Dark-stage friendly, self-contained.
import MorphingPopover, { MorphingPopoverContent, MorphingPopoverTrigger } from './MorphingPopover'

function MorphingPopoverDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <MorphingPopover>
        <MorphingPopoverTrigger class="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white">
          Leave a comment
        </MorphingPopoverTrigger>
        <MorphingPopoverContent class="flex w-80 flex-col gap-3 rounded-lg bg-neutral-900 text-neutral-100">
          <p class="text-sm text-neutral-400">Share feedback about this component library.</p>
          <textarea
            rows={3}
            placeholder="What did you like?"
            class="w-full resize-none rounded-md border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-500"
          />
          <div class="flex justify-end gap-2">
            <button class="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium hover:bg-neutral-800">
              Cancel
            </button>
            <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white">
              Post
            </button>
          </div>
        </MorphingPopoverContent>
      </MorphingPopover>
    </div>
  )
}

export default MorphingPopoverDemo
