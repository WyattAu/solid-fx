import ShinyText from './ShinyText'

function ShinyTextDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 bg-gray-950">
      <ShinyText text="Shiny Text" speed={3} className="text-5xl font-bold" />
      <ShinyText
        text="Glowing Sweep"
        speed={2}
        glow={0.7}
        shineColor="#a5f3fc"
        className="text-4xl font-semibold"
      />
    </div>
  )
}

export default ShinyTextDemo
