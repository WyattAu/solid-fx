// Demo harness for the TextAnimate port. Dark-stage friendly, self-contained.
// Word-level blur-in reveal plus a character-level fade, staggered by the
// duration window (scroll into view not required — demo stages are in view).
import TextAnimate from './TextAnimate'

function TextAnimateDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-lg border border-gray-800 bg-gray-950 px-6 text-center">
      <TextAnimate
        as="h2"
        by="word"
        animation="blurInUp"
        duration={0.8}
        class="text-3xl font-bold text-white"
      >
        Motion primitives for Solid
      </TextAnimate>
      <TextAnimate
        by="character"
        animation="fadeIn"
        delay={0.6}
        duration={0.6}
        class="max-w-md text-sm text-neutral-400"
        segmentClassName="inline-block"
      >
        Staggered word and character reveals, one component.
      </TextAnimate>
    </div>
  )
}

export default TextAnimateDemo
