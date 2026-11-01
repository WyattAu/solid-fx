import { For } from 'solid-js'
import AnimatedContent from './AnimatedContent'

const FEATURES = [
  { title: 'Scroll-triggered', body: 'Content animates in when it enters the viewport.' },
  { title: 'Staggered children', body: 'Each child follows with a 0.12s offset.' },
  { title: 'Reduced motion aware', body: 'Content appears instantly when motion is reduced.' },
]

function AnimatedContentDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-6">
      <AnimatedContent
        trigger="mount"
        distance={48}
        blur={8}
        duration={1}
        stagger={0.12}
        class="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <For each={FEATURES}>
          {feature => (
            <div class="rounded-xl bg-white/5 p-4">
              <h3 class="text-base font-semibold text-white">{feature.title}</h3>
              <p class="mt-1 text-sm text-white/60">{feature.body}</p>
            </div>
          )}
        </For>
      </AnimatedContent>
    </div>
  )
}

export default AnimatedContentDemo
