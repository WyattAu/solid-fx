import ScrambledText from './ScrambledText'

function ScrambledTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950">
      <ScrambledText
        radius={100}
        duration={1.2}
        speed={0.5}
        scrambleChars=".:"
        effect="magnify"
        class="text-white"
      >
        Hover over this text to scramble it with a magnetic wave.
      </ScrambledText>
    </div>
  )
}

export default ScrambledTextDemo
