// Source: github.com/magicuidesign/magicui apps/www/registry/example/animated-list-demo.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream notification cards carry light + `dark:` variants; pinned to the
// dark variants so they read on the docs' dark stage.
import { For } from 'solid-js'
import AnimatedList from './AnimatedList'

interface Item {
  name: string
  description: string
  icon: string
  color: string
  time: string
}

const notifications: Item[] = [
  {
    name: 'Payment received',
    description: 'Magic UI',
    time: '15m ago',
    icon: '💸',
    color: '#00C9A7',
  },
  {
    name: 'User signed up',
    description: 'Magic UI',
    time: '10m ago',
    icon: '👤',
    color: '#FFB800',
  },
  {
    name: 'New message',
    description: 'Magic UI',
    time: '5m ago',
    icon: '💬',
    color: '#FF3D71',
  },
  {
    name: 'New event',
    description: 'Magic UI',
    time: '2m ago',
    icon: '🗞️',
    color: '#1E86FF',
  },
]

const Notification = (props: { item: Item }) => {
  return (
    <figure class="relative mx-auto min-h-fit w-full max-w-[400px] transform-gpu cursor-pointer overflow-hidden rounded-2xl bg-transparent p-4 backdrop-blur-md transition-all duration-200 ease-in-out [border:1px_solid_rgba(255,255,255,.1)] [box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] hover:scale-[103%]">
      <div class="flex flex-row items-center gap-3">
        <div
          class="flex size-10 items-center justify-center rounded-2xl"
          style={{ 'background-color': props.item.color }}
        >
          <span class="text-lg">{props.item.icon}</span>
        </div>
        <div class="flex flex-col overflow-hidden">
          <figcaption class="flex flex-row items-center text-lg font-medium whitespace-pre text-white">
            <span class="text-sm sm:text-lg">{props.item.name}</span>
            <span class="mx-1">·</span>
            <span class="text-xs text-gray-500">{props.item.time}</span>
          </figcaption>
          <p class="text-sm font-normal text-white/60">{props.item.description}</p>
        </div>
      </div>
    </figure>
  )
}

function AnimatedListDemo() {
  return (
    <div class="relative flex h-96 w-full flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-2">
      <AnimatedList delay={1200}>
        <For each={notifications}>{item => <Notification item={item} />}</For>
      </AnimatedList>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-gray-950 to-transparent" />
    </div>
  )
}

export default AnimatedListDemo
