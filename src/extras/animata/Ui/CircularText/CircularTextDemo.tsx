// Source: demo harness derived from github.com/codse/animata animata/text/circular-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import CircularText from './CircularText'

function CircularTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <CircularText
        text="CIRCULAR•TEXT•COMPONENT•"
        spinDuration={30}
        radius={5}
        class="text-neutral-100"
      />
    </div>
  )
}

export default CircularTextDemo
