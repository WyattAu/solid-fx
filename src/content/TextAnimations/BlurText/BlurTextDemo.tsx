import BlurText from './BlurText'

function BlurTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-6">
      <BlurText
        text="Words arrive one by one, blurred into focus."
        delay={100}
        animateBy="words"
        direction="top"
        trigger="load"
        class="max-w-md text-center text-3xl font-semibold text-white"
      />
    </div>
  )
}

export default BlurTextDemo
