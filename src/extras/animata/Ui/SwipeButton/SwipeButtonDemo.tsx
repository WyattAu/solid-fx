// Source: demo harness derived from github.com/codse/animata animata/button/swipe-button.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import SwipeButton from './SwipeButton'

function SwipeButtonDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 rounded-lg border border-gray-800 bg-gray-950">
      <SwipeButton firstText="Swipe me" secondText="You got it" />
      <SwipeButton
        firstText="Get started"
        secondText="Let's go"
        firstClass="bg-cyan-500 text-black"
        secondClass="bg-fuchsia-600 text-white"
      />
    </div>
  )
}

export default SwipeButtonDemo
