import RotatingText from './RotatingText'

function RotatingTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center gap-4 bg-gray-950">
      <span class="text-3xl font-semibold text-white">Solid is</span>
      <RotatingText
        texts={['fast', 'reactive', 'simple', 'tiny']}
        rotationInterval={2200}
        effect="slide"
        staggerDuration={0.03}
        mainClassName="text-3xl font-bold text-purple-400"
      />
    </div>
  )
}

export default RotatingTextDemo
