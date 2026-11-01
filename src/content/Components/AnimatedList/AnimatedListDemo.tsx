import AnimatedList from './AnimatedList'

function AnimatedListDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-6">
      <AnimatedList width={380} maxHeight={340} animation="pop" />
    </div>
  )
}

export default AnimatedListDemo
