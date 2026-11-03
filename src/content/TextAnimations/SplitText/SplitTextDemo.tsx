import SplitText from './SplitText'

function SplitTextDemo() {
  return (
    <div class="flex h-72 items-center justify-center p-8">
      <SplitText
        text="solid-fx"
        class="text-4xl font-bold text-white"
        delay={100}
        duration={800}
      />
    </div>
  )
}

export default SplitTextDemo
