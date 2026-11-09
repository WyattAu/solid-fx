// Source: github.com/magicuidesign/magicui apps/www/registry/example/text-animate-demo-7.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import TextGenerate from './TextGenerate'

function TextGenerateDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 rounded-lg border border-gray-800 bg-gray-950 p-6">
      <TextGenerate class="text-2xl font-bold text-zinc-100" delay={0.2}>
        Word by word, the text sharpens into focus
      </TextGenerate>
      <TextGenerate
        class="font-mono text-sm text-zinc-400"
        animation="blurInUp"
        by="character"
        delay={0.8}
      >
        blur in by character
      </TextGenerate>
    </div>
  )
}

export default TextGenerateDemo
