// Source: github.com/codse/animata animata/button/work-button.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream is a zero-prop pure-CSS button; class / className are
// accepted per the extras contract. `group/work` hover state and the
// translate-y reveal are unchanged Tailwind v4 utilities.

interface WorkButtonProps {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export default function WorkButton(props: WorkButtonProps) {
  return (
    <button
      type="button"
      class={`group/work relative overflow-hidden rounded-full bg-purple-950 px-14 py-4 text-lg transition-colors ${props.class ?? ''} ${props.className ?? ''}`}
    >
      <span class="absolute bottom-0 left-0 h-48 w-full origin-bottom translate-y-full transform overflow-hidden rounded-full bg-white/15 transition-transform duration-300 ease-out group-hover/work:translate-y-14" />
      <span class="font-semibold text-purple-200">Work with us</span>
    </button>
  )
}
