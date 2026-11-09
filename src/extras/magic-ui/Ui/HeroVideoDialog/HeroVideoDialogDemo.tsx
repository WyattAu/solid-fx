// Source: github.com/magicuidesign/magicui apps/www/registry/example/hero-video-dialog-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream renders a light/dark pair of instances; pinned to a single
// dark-stage instance. The thumbnail uses picsum per the demo contract; the
// dialog itself opens on click only, so the demo needs no interaction.
import HeroVideoDialog from './HeroVideoDialog'

function HeroVideoDialogDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-6">
      <HeroVideoDialog
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
        thumbnailSrc="https://picsum.photos/seed/hero-video-dialog/1280/720"
        thumbnailAlt="Hero Video"
      />
    </div>
  )
}

export default HeroVideoDialogDemo
