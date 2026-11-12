// Source: demo harness derived from github.com/codse/animata animata/container/fibonacci-lines.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import FibonacciLines from './FibonacciLines'

function FibonacciLinesDemo() {
  return (
    <div class="flex h-96 w-full flex-col justify-center rounded-lg border border-gray-800 bg-gray-950 px-8">
      <FibonacciLines reverse={false} class="w-full" />
    </div>
  )
}

export default FibonacciLinesDemo
