// Source: github.com/magicuidesign/magicui apps/www/registry/example/word-rotate-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import WordsRotate from './WordsRotate'

function WordsRotateDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 rounded-lg border border-gray-800 bg-gray-950 p-6">
      <WordsRotate class="text-4xl font-bold text-zinc-100" words={['Words', 'Rotate']} />
      <WordsRotate
        class="font-mono text-lg text-zinc-400"
        duration={1800}
        words={['build', 'ship', 'iterate']}
      />
    </div>
  )
}

export default WordsRotateDemo
