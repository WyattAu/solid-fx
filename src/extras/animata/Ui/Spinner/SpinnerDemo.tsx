// Source: demo harness derived from github.com/codse/animata animata/progress/spinner.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import Spinner from './Spinner'

function SpinnerDemo() {
  return (
    <div class="flex h-64 w-full items-center justify-center gap-6 rounded-lg border border-gray-800 bg-gray-950">
      <Spinner outerSize="h-4 w-4" childSize="h-3 w-3" />
      <Spinner />
      <Spinner outerSize="h-12 w-12" childSize="h-10 w-10" />
    </div>
  )
}

export default SpinnerDemo
