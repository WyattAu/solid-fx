// Source: github.com/codse/animata animata/text/text-flip.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream uses the Tailwind theme animation `animate-flip-words`
// (keyframes in styles/globals.css); this port inlines the same keyframes in an
// enclosing <style> element under a scoped class name (keyframes can't ship as
// Tailwind classes, and the theme token isn't defined here). The word-height
// measurement useEffect maps to onMount (spans are removed inline; nothing
// persists). The word list renders via <For>. No upstream props; class /
// className are accepted per the extras contract.
import { For, onMount } from 'solid-js'

const FLIP_WORDS = ['fantastic', 'love', 'fire', 'awesome', 'fantastic']

const textFlipStyles = `
.tf-flip-words {
  animation: tf-flip-words 8s infinite;
}
@keyframes tf-flip-words {
  10% {
    transform: translateY(-112%);
  }
  25% {
    transform: translateY(-100%);
  }
  35% {
    transform: translateY(-212%);
  }
  50% {
    transform: translateY(-200%);
  }
  60% {
    transform: translateY(-312%);
  }
  75% {
    transform: translateY(-300%);
  }
  85% {
    transform: translateY(-412%);
  }
  100% {
    transform: translateY(-400%);
  }
}
`

interface TextFlipProps {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export default function TextFlip(props: TextFlipProps) {
  let tallestEl!: HTMLDivElement

  // Measure the tallest word once after mount and pin the viewport to it.
  onMount(() => {
    const host = tallestEl
    if (!host) return
    let maxHeight = 0
    for (const word of FLIP_WORDS) {
      const span = document.createElement('span')
      span.className = 'absolute opacity-0'
      span.textContent = word
      host.appendChild(span)
      const height = span.offsetHeight
      host.removeChild(span)
      if (height > maxHeight) {
        maxHeight = height
      }
    }
    host.style.height = `${maxHeight}px`
  })

  return (
    <div
      class={`box-content flex gap-4 text-3xl font-semibold ${props.class ?? ''} ${props.className ?? ''}`}
    >
      <style>{textFlipStyles}</style>
      <p class="text-foreground">Coding is</p>
      <div ref={tallestEl} class="flex flex-col overflow-hidden text-blue-400">
        <For each={FLIP_WORDS}>{word => <span class="tf-flip-words">{word}</span>}</For>
      </div>
    </div>
  )
}
