// Source: github.com/magicuidesign/magicui apps/www/registry/example/word-rotate-demo.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream demo cycles ["Word", "Rotate"] bare on the docs page; staged on a
// dark surface with an extra word so the wait-mode exit/enter is visible.
import WordRotate from './WordRotate'

function WordRotateDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <WordRotate
        class="text-4xl font-bold text-white"
        words={['Word', 'Rotate', 'Solid']}
      />
    </div>
  )
}

export default WordRotateDemo
