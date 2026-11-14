// Source: github.com/magicuidesign/magicui apps/www/registry/example/video-text-demo.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream streams cdn.magicui.design's ocean clip over the network (same as
// the upstream docs demo) — the only network dependency here.
import VideoText from './VideoText'

function VideoTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="relative h-[200px] w-full max-w-2xl overflow-hidden">
        <VideoText src="https://cdn.magicui.design/ocean-small.webm">OCEAN</VideoText>
      </div>
    </div>
  )
}

export default VideoTextDemo
