// Source: github.com/magicuidesign/magicui apps/www/registry/example/pulsating-button-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream demo relies on the shadcn `bg-primary` token; explicit background
// classes pin both variants onto the dark stage without site theme changes.
import PulsatingButton from './PulsatingButton'

function PulsatingButtonDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 rounded-lg border border-gray-800 bg-gray-950">
      <PulsatingButton class="bg-sky-500 text-sky-50">
        Join Affiliate Program
      </PulsatingButton>
      <PulsatingButton
        variant="ripple"
        class="bg-emerald-500 text-emerald-50"
        pulseColor="#10b981"
        distance="14px"
      >
        Ripple Variant
      </PulsatingButton>
    </div>
  )
}

export default PulsatingButtonDemo
