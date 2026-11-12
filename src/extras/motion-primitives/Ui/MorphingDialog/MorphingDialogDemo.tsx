// Demo harness for the MorphingDialog port. Dark-stage friendly, self-contained.
// Mirrors the upstream docs demo: a trigger card (image, title, subtitle,
// description) morphs into the full dialog.
import MorphingDialog, {
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from './MorphingDialog'

function MorphingDialogDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <MorphingDialog transition={{ type: 'spring', bounce: 0, duration: 0.5 }}>
        <MorphingDialogTrigger class="grid w-72 grid-cols-1 gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 text-left">
          <MorphingDialogImage
            src="https://picsum.photos/seed/morphing-dialog/600/400"
            alt="Abstract gradient artwork"
            class="h-36 w-full rounded-xl object-cover"
          />
          <div class="flex flex-col gap-2 p-2">
            <MorphingDialogTitle class="text-base font-semibold text-white">
              Morphing Dialog
            </MorphingDialogTitle>
            <MorphingDialogSubtitle class="text-xs text-neutral-400">
              Shared-element transition
            </MorphingDialogSubtitle>
            <MorphingDialogDescription class="text-xs text-neutral-500">
              Click the card to expand it into a full dialog.
            </MorphingDialogDescription>
          </div>
        </MorphingDialogTrigger>
        <MorphingDialogContainer>
          <MorphingDialogContent class="relative w-[28rem] max-w-[92vw] rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-100 shadow-2xl">
            <MorphingDialogImage
              src="https://picsum.photos/seed/morphing-dialog/600/400"
              alt="Abstract gradient artwork"
              class="h-48 w-full object-cover"
            />
            <div class="flex flex-col gap-3 p-6">
              <MorphingDialogTitle class="text-xl font-semibold text-white">
                Morphing Dialog
              </MorphingDialogTitle>
              <MorphingDialogSubtitle class="text-sm text-neutral-400">
                Shared-element transition
              </MorphingDialogSubtitle>
              <MorphingDialogDescription class="text-sm leading-relaxed text-neutral-400">
                The card morphs into this dialog: the image, title, and subtitle travel from the
                trigger into the expanded layout, the backdrop fades in, and the close button
                appears staged. Escape, the close button, or clicking the backdrop all morph back
                into the card.
              </MorphingDialogDescription>
              <div class="mt-2 flex justify-end gap-2">
                <button class="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium hover:bg-neutral-800">
                  Later
                </button>
                <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white">
                  Got it
                </button>
              </div>
            </div>
            <MorphingDialogClose class="rounded-full bg-neutral-800 p-1.5 text-neutral-300 hover:bg-neutral-700" />
          </MorphingDialogContent>
        </MorphingDialogContainer>
      </MorphingDialog>
    </div>
  )
}

export default MorphingDialogDemo
