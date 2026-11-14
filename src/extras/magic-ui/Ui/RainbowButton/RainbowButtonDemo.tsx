// Source: github.com/magicuidesign/magicui apps/www/registry/example/rainbow-button-demo.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream demo is a bare button; staged on the docs' dark background with
// the outline variant alongside for contrast.
import RainbowButton from './RainbowButton'

function RainbowButtonDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-lg border border-gray-800 bg-gray-950">
      <RainbowButton>Get Unlimited Access</RainbowButton>
      <RainbowButton variant="outline" size="lg">
        Outline Variant · Large
      </RainbowButton>
    </div>
  )
}

export default RainbowButtonDemo
