// Source: demo harness derived from github.com/codse/animata animata/background/grid.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import Grid from './Grid'

function GridDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-4">
      <Grid
        color="#262626"
        size={20}
        class="h-full w-full overflow-hidden rounded-md"
        style={{ 'background-color': '#09090b' }}
      />
    </div>
  )
}

export default GridDemo
