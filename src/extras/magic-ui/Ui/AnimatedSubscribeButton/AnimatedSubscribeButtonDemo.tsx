// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/animated-subscribe-button.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// No upstream demo ships in the registry for this component; self-authored per
// the demo contract. The controlled subscribed state plays its enter animation
// (button fade + span y:-50 → 0 spring) on mount, so the demo looks alive
// without interaction; text pinned to the dark stage.
import AnimatedSubscribeButton from './AnimatedSubscribeButton'

function AnimatedSubscribeButtonDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-4 rounded-lg border border-gray-800 bg-gray-950">
      <AnimatedSubscribeButton subscribeStatus={true}>
        <span>Subscribe</span>
        <span>Subscribed ✓</span>
      </AnimatedSubscribeButton>
      <span class="text-sm text-gray-500">click to toggle when uncontrolled</span>
    </div>
  )
}

export default AnimatedSubscribeButtonDemo
