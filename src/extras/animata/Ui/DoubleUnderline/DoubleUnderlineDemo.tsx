// Source: demo harness derived from github.com/codse/animata animata/text/double-underline.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream text classes are zinc-900 with a dark: variant; this repo's
// dark stage has no `dark` class ancestor, so the demo stages the word on a light
// chip (same trick as the Dot/Grid placeholders) to stay readable.
import DoubleUnderline from './DoubleUnderline'

function DoubleUnderlineDemo() {
  return (
    <div class="flex h-64 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="rounded-lg bg-neutral-200 px-8 py-6 shadow-lg">
        <p class="text-2xl text-zinc-900">
          Hover me: <DoubleUnderline>double underline</DoubleUnderline> lifts its second stroke.
        </p>
      </div>
    </div>
  )
}

export default DoubleUnderlineDemo
