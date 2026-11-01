import ScrollFloat from './ScrollFloat'

function ScrollFloatDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-y-auto bg-gray-950">
      <ScrollFloat
        effect="float"
        splitBy="chars"
        direction="up"
        stagger={0.03}
        containerClassName="text-center"
        textClassName="text-white"
      >
        Scroll Into View
      </ScrollFloat>
    </div>
  )
}

export default ScrollFloatDemo
