// Source: github.com/magicuidesign/magicui apps/www/registry/example/confetti-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream fires via the imperative ref on hover; this demo keeps the canvas
// auto-fire (manualstart defaults to false) so it looks alive without
// interaction, and adds the file's second export (ConfettiButton). Text pinned
// to the dark variant for the docs' dark stage.
import { Confetti, ConfettiButton, type ConfettiRef } from './ConfettiButton'

function ConfettiButtonDemo() {
  let confettiRef: ConfettiRef | undefined

  return (
    <div class="relative flex h-[500px] w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <span class="pointer-events-none bg-linear-to-b from-white to-slate-900/10 bg-clip-text text-center text-8xl leading-none font-semibold whitespace-pre-wrap text-transparent">
        Confetti
      </span>

      <Confetti
        ref={api => {
          confettiRef = api
        }}
        class="absolute top-0 left-0 z-0 size-full"
      />

      <ConfettiButton class="relative z-10" onClick={() => confettiRef?.fire({})}>
        Fire confetti
      </ConfettiButton>
    </div>
  )
}

export default ConfettiButtonDemo
