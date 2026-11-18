// solid-fx TextAnimations widget — original component (not a port).
import SplittingText from './SplittingText'

function SplittingTextDemo() {
  return (
    <div class="flex w-full flex-col gap-8 p-6 text-gray-200">
      <div class="space-y-2">
        <p class="text-xs text-gray-500">by chars (stagger 28ms)</p>
        <p class="text-2xl">
          <SplittingText by="chars">
            Characters arrive one by one, riding a small flip.
          </SplittingText>
        </p>
      </div>
      <div class="space-y-2">
        <p class="text-xs text-gray-500">by words (stagger 70ms)</p>
        <h3 class="text-3xl">
          <SplittingText by="words" stagger={70} duration={600}>
            Words land in reading order, keeping the sentence intact.
          </SplittingText>
        </h3>
      </div>
      <div class="space-y-2">
        <p class="text-xs text-gray-500">viewport-triggered</p>
        <p class="text-xl">
          <SplittingText by="chars" stagger={20}>
            This line waits to animate until it scrolls into view.
          </SplittingText>
        </p>
      </div>
    </div>
  )
}

export default SplittingTextDemo
