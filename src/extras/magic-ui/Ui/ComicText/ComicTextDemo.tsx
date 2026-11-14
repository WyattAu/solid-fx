// Source: github.com/magicuidesign/magicui apps/www/registry/example/comic-text-demo.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream demo renders a single "BOOM!" at fontSize 5; staged on a dark
// surface with a second size so the entrance spring is visible in isolation.
import ComicText from './ComicText'

function ComicTextDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-12 rounded-lg border border-gray-800 bg-gray-950 text-center">
      <ComicText fontSize={5}>BOOM!</ComicText>
      <ComicText fontSize={3} class="text-white">
        POW!
      </ComicText>
    </div>
  )
}

export default ComicTextDemo
