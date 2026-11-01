import StrokeText from './StrokeText'

function StrokeTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 text-white">
      <StrokeText text="Draw Attention" trigger="mount" fontSize={72} strokeColor="#A78BFA" />
    </div>
  )
}

export default StrokeTextDemo
