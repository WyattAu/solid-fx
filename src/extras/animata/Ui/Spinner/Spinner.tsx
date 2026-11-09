// Source: github.com/codse/animata animata/progress/spinner.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream merges classes with cn() (clsx + tailwind-merge); this port
// template-joins, equivalent for the plain strings passed here.
interface SpinnerProps {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  outerSize?: string
  childSize?: string
}

export default function Spinner(props: SpinnerProps) {
  return (
    <div
      class={`m-2 h-8 w-8 animate-spin items-center justify-center rounded-full bg-linear-to-bl from-pink-500 to-blue-600 p-0.5 ${props.class ?? ''} ${props.className ?? ''} ${props.outerSize ?? ''}`}
    >
      <div class={`h-6 w-6 rounded-full bg-white ${props.childSize ?? ''}`} />
    </div>
  )
}
