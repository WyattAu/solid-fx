// Source: demo harness derived from github.com/codse/animata animata/background/blurry-blob.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import BlurryBlob from './BlurryBlob'

function BlurryBlobDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <BlurryBlob firstBlobColor="bg-purple-500" secondBlobColor="bg-blue-500" class="opacity-60" />
    </div>
  )
}

export default BlurryBlobDemo
