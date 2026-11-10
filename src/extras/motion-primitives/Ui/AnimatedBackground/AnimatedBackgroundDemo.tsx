// Source: github.com/ibelick/motion-primitives app/docs/animated-background/segmented-control.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import { For } from 'solid-js'
import AnimatedBackground from './AnimatedBackground'

function AnimatedBackgroundDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-6">
      <div class="rounded-[8px] bg-zinc-800 p-[2px]">
        <AnimatedBackground
          defaultValue="Day"
          class="rounded-lg bg-zinc-600"
          transition={{
            ease: 'easeInOut',
            duration: 0.2,
          }}
        >
          <For each={['Day', 'Week', 'Month', 'Year']}>
            {label => (
              <button
                type="button"
                data-id={label}
                aria-label={`${label} view`}
                class="inline-flex w-20 items-center justify-center text-center text-zinc-100 transition-transform active:scale-[0.98]"
              >
                {label}
              </button>
            )}
          </For>
        </AnimatedBackground>
      </div>
    </div>
  )
}

export default AnimatedBackgroundDemo
