import TextType from './TextType'

function TextTypeDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 bg-gray-950 p-8">
      <TextType
        class="font-mono text-3xl text-emerald-300"
        text={['npm install solid-bits', 'bun run dev', 'git commit -m "ship it"']}
        typingSpeed={55}
        deletingSpeed={25}
        pauseDuration={1400}
        cursorStyle="bar"
      />
      <TextType
        class="text-lg text-gray-400"
        text="Deleting is just typing in reverse..."
        cursorCharacter="_"
      />
    </div>
  )
}

export default TextTypeDemo
