// Source: github.com/magicuidesign/magic-ui apps/www/registry/example/marquee-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import { For } from 'solid-js'
import Marquee from './Marquee'

const REVIEWS = [
  'Source you own — copy it, tune every value.',
  'Spring physics out of the box.',
  'Strict TypeScript, zero React.',
  'Dark-mode friendly by default.',
  'One dir per component, no registry needed.',
  'Cleanup discipline in every effect.',
]

function MarqueeDemo() {
  return (
    <div class="flex h-96 w-full flex-col justify-center gap-4 overflow-hidden bg-gray-950 p-4 text-white">
      <For each={[false, true]}>
        {reverse => (
          <Marquee pauseOnHover reverse={reverse}>
            <For each={REVIEWS}>
              {review => (
                <div class="flex w-72 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 px-6 py-3 text-sm text-gray-300">
                  {review}
                </div>
              )}
            </For>
          </Marquee>
        )}
      </For>
    </div>
  )
}

export default MarqueeDemo
