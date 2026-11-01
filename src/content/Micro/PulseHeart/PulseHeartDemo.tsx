import { For } from 'solid-js'
import PulseHeart from './PulseHeart'

function PulseHeartDemo() {
  return (
    <div class="flex h-96 w-full flex-wrap items-center justify-center gap-6 bg-gray-950 p-8 text-white">
      <PulseHeart liked count={128} label="Likes" />
      <PulseHeart icon="star" count={42} likedColor="#fbbf24" label="Stars" />
      <PulseHeart icon="thumb" count={7} likedColor="#38bdf8" idleOutline={false} label="Helpful" />
      <For each={[12, 348, 1024]}>
        {n => <PulseHeart count={n} size={32} label={`Post ${n}`} />}
      </For>
    </div>
  )
}

export default PulseHeartDemo
