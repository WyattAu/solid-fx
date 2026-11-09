// Source: github.com/ibelick/motion-primitives app/docs/border-trail/border-trail-card-1.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import BorderTrail from './BorderTrail'

function BorderTrailDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="relative flex h-[200px] w-[300px] flex-col items-center justify-center rounded-md bg-zinc-900 px-5 py-2">
        <BorderTrail
          class="bg-zinc-400"
          style={{
            'box-shadow':
              '0px 0px 60px 30px rgb(255 255 255 / 20%), 0 0 100px 60px rgb(255 255 255 / 8%), 0 0 140px 90px rgb(255 255 255 / 5%)',
          }}
          size={100}
        />
        <div
          class="flex h-full animate-pulse flex-col items-start justify-center space-y-2"
          role="status"
          aria-label="Loading..."
        >
          <div class="h-1 w-4 rounded-[4px] bg-zinc-600" />
          <div class="h-1 w-10 rounded-[4px] bg-zinc-600" />
          <div class="h-1 w-12 rounded-[4px] bg-zinc-600" />
          <div class="h-1 w-12 rounded-[4px] bg-zinc-600" />
          <div class="h-1 w-12 rounded-[4px] bg-zinc-600" />
        </div>
      </div>
    </div>
  )
}

export default BorderTrailDemo
