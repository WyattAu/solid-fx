// Source: github.com/ibelick/motion-primitives app/docs/spinning-text/spinning-text-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import SpinningText from './SpinningText'

function SpinningTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-6">
      <div class="flex h-56 w-56 items-center justify-center">
        <SpinningText radius={5} fontSize={1.2} class="font-medium leading-none text-zinc-100">
          {`pre-order • pre-order • pre-order • `}
        </SpinningText>
      </div>
    </div>
  )
}

export default SpinningTextDemo
