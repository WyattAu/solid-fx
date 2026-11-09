// Source: github.com/ibelick/motion-primitives app/docs/animated-number/animated-number-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import { createSignal, onMount } from 'solid-js'
import AnimatedNumber from './AnimatedNumber'

function AnimatedNumberDemo() {
  const [value, setValue] = createSignal(0)

  onMount(() => setValue(2082))

  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          class="mr-3 h-3 w-3 fill-transparent stroke-zinc-100 stroke-[1.3]"
        >
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
        </svg>
        <AnimatedNumber
          class="inline-flex items-center font-mono text-2xl font-light text-zinc-100"
          springOptions={{ bounce: 0, duration: 2000 }}
          value={value()}
        />
      </div>
    </div>
  )
}

export default AnimatedNumberDemo
