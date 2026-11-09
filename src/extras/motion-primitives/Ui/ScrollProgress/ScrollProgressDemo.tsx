// Source: github.com/ibelick/motion-primitives app/docs/scroll-progress/scroll-progress-basic-1.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import { For } from 'solid-js'
import ScrollProgress from './ScrollProgress'

function ScrollProgressDemo() {
  // Solid has no ref object — expose the scroller through a getter so the
  // component reads `.current` at mount, after the ref assignment.
  let container!: HTMLDivElement
  const containerRef = {
    get current() {
      return container
    },
  }

  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <div ref={container} class="h-full overflow-auto px-8 pb-16 pt-16">
        <div class="pointer-events-none absolute top-0 left-0 w-full">
          <div class="absolute top-0 left-0 h-1 w-full bg-gray-800" />
          <ScrollProgress containerRef={containerRef} class="absolute top-0 bg-[#0090FF]" />
        </div>
        <For each={[0, 1, 2, 3, 4, 5, 6, 7]}>
          {() => (
            <p class="pb-4 font-mono text-sm text-zinc-500">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit
              amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante
              hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet
              vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur.
            </p>
          )}
        </For>
      </div>
    </div>
  )
}

export default ScrollProgressDemo
