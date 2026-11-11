// Source: demo harness derived from github.com/codse/animata animata/text/underline-hover-text.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import UnderlineHoverText from './UnderlineHoverText'

function UnderlineHoverTextDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-lg border border-gray-800 bg-gray-950">
      <UnderlineHoverText
        text="Hover over me"
        textColor="text-zinc-100"
        hoverColor="bg-fuchsia-500"
      />
      <UnderlineHoverText
        text="Links feel alive"
        fontSize="text-xl"
        textColor="text-zinc-300"
        hoverColor="bg-cyan-400"
        hoverTextColor="hover:text-cyan-300"
      />
    </div>
  )
}

export default UnderlineHoverTextDemo
