// Demo harness for the Dialog port. Dark-stage friendly, self-contained.
import Dialog, {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog'

function DialogDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <Dialog>
        <DialogTrigger class="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white">
          Open Dialog
        </DialogTrigger>
        <DialogContent class="max-w-md bg-white text-neutral-900">
          <DialogHeader class="p-6 pb-2">
            <DialogTitle>Delete workspace?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All projects and deployments in this workspace will be
              permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogClose class="top-3 right-3 text-neutral-400 hover:text-neutral-700" />
          <div class="flex justify-end gap-2 p-6 pt-2">
            <DialogClose class="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50">
              Cancel
            </DialogClose>
            <DialogClose class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500">
              Delete
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DialogDemo
