// Source: github.com/magicuidesign/magicui apps/www/registry/example/number-ticker-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream demo renders a bare ticker on the docs page; staged here on a
// dark surface with extra stat rows so the spring roll is visible in isolation.
import NumberTicker from './NumberTicker'

function NumberTickerDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-gray-950 p-8 text-white">
      <NumberTicker value={100} class="text-8xl font-medium tracking-tighter whitespace-pre-wrap" />
      <div class="flex gap-8 text-sm text-gray-400">
        <span>
          <NumberTicker value={42} class="text-white" /> stars
        </span>
        <span>
          <NumberTicker value={1337} delay={0.4} class="text-white" /> commits
        </span>
        <span>
          <NumberTicker value={99.9} decimalPlaces={1} delay={0.8} class="text-white" />% uptime
        </span>
      </div>
    </div>
  )
}

export default NumberTickerDemo
