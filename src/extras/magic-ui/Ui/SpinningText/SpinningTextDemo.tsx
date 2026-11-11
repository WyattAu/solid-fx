// Source: github.com/magicuidesign/magicui apps/www/registry/example/spinning-text-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream demo spins a longer string at the default radius; the demo text is
// sized so the letters stay legible on the dark stage without interaction.
import SpinningText from './SpinningText'

function SpinningTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <SpinningText class="font-medium text-3xl text-white" radius={7}>
        solid-fx • magic-ui •
      </SpinningText>
    </div>
  )
}

export default SpinningTextDemo
