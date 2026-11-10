import OrbitingCircles from './OrbitingCircles'

function OrbitingCirclesDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="relative flex h-full w-full items-center justify-center overflow-hidden">
        <span class="pointer-events-none size-16 rounded-full border border-white/5 bg-white/10 text-3xl text-center leading-[4rem]">
          ✨
        </span>
        <OrbitingCircles iconSize={40}>
          <span class="text-2xl">🌙</span>
          <span class="text-2xl">⭐</span>
          <span class="text-2xl">🔥</span>
        </OrbitingCircles>
        <OrbitingCircles iconSize={30} radius={100} reverse speed={1.5}>
          <span class="text-xl">⚡</span>
          <span class="text-xl">💠</span>
          <span class="text-xl">🚀</span>
          <span class="text-xl">🎯</span>
        </OrbitingCircles>
      </div>
    </div>
  )
}

export default OrbitingCirclesDemo
