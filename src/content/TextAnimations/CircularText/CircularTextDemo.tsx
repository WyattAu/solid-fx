import CircularText from './CircularText'

function CircularTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8 text-white">
      <CircularText
        text="SOLID•BITS•CIRCULAR•TEXT•"
        spinDuration={14}
        onHover="slowDown"
        size={220}
        fontSize={22}
        letterSpacing={2}
      >
        <span class="text-4xl">✳</span>
      </CircularText>
    </div>
  )
}

export default CircularTextDemo
