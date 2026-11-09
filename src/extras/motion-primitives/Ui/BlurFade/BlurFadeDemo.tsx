// Source: github.com/magicuidesign/magicui apps/www/registry/example/blur-fade-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { For } from 'solid-js'
import BlurFade from './BlurFade'

const images = Array.from({ length: 6 }, (_, i) => {
  const isLandscape = i % 2 === 0
  const width = isLandscape ? 800 : 600
  const height = isLandscape ? 600 : 800
  return `https://picsum.photos/seed/${i + 1}/${width}/${height}`
})

function BlurFadeDemo() {
  return (
    <div class="h-96 w-full overflow-y-auto rounded-lg border border-gray-800 bg-gray-950 p-6">
      <div class="columns-2 gap-4 sm:columns-3">
        <For each={images}>
          {(imageUrl, idx) => (
            <BlurFade delay={0.25 + idx() * 0.05} inView class="mb-4">
              <img
                class="size-full rounded-lg object-contain"
                src={imageUrl}
                alt={`Stock photo ${idx() + 1}`}
              />
            </BlurFade>
          )}
        </For>
      </div>
    </div>
  )
}

export default BlurFadeDemo
