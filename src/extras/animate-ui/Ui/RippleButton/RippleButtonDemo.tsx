// solid-fx Buttons widget — original component (not a port).
import RippleButton from './RippleButton'

function RippleButtonDemo() {
  return (
    <div class="flex w-full items-center justify-center gap-4 p-6">
      <RippleButton>click anywhere on me</RippleButton>
      <RippleButton
        rippleColor="rgba(56, 189, 248, 0.5)"
        duration={800}
        class="border-sky-700 text-sky-200"
      >
        sky ripple
      </RippleButton>
    </div>
  )
}

export default RippleButtonDemo
