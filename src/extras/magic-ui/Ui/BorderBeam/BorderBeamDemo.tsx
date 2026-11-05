// Source: github.com/magicuidesign/magic-ui apps/www/registry/example/border-beam-demo.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
// Upstream demo wraps a shadcn Card; replaced with an equivalent
// self-contained card so the demo has no component dependencies.
import BorderBeam from './BorderBeam'

function BorderBeamDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8 text-white">
      <div class="relative flex h-64 w-[350px] flex-col justify-between overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div>
          <p class="text-lg font-semibold">Notifications</p>
          <p class="mt-1 text-sm text-gray-400">
            Deploy finished, checks passed, and the docs pipeline is green.
          </p>
        </div>
        <p class="text-xs text-gray-500">Clockwise beam + delayed reverse beam</p>
        <BorderBeam duration={8} size={100} />
        <BorderBeam
          duration={8}
          size={100}
          delay={4}
          reverse
          colorFrom="#9c40ff"
          colorTo="#ffaa40"
        />
      </div>
    </div>
  )
}

export default BorderBeamDemo
