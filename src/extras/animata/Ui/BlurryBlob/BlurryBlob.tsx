// Source: github.com/codse/animata animata/background/blurry-blob.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream registers `pop-blob` as a Tailwind theme token
// (--animate-pop-blob in styles/globals.css); this port ships the keyframes and
// the animate-pop-blob utility in an inline <style> so the component is
// self-contained under this repo's Tailwind setup. Upstream merges classes with
// cn() (clsx + tailwind-merge); this port template-joins, equivalent for the
// plain strings passed here.
import type { JSX } from 'solid-js'

interface BlobProps extends JSX.HTMLAttributes<HTMLDivElement> {
  firstBlobColor: string
  secondBlobColor: string
  /** React parity alias; merges with `class`. */
  className?: string
}

const blobStyles = `
@keyframes pop-blob {
  0% { transform: scale(1); }
  33% { transform: scale(1.2); }
  66% { transform: scale(0.8); }
  100% { transform: scale(1); }
}
.animate-pop-blob { animation: pop-blob 4s infinite; }
`

export default function BlurryBlob(props: BlobProps) {
  return (
    <div class="min-h-52 min-w-52 items-center justify-center">
      <style>{blobStyles}</style>
      <div class="relative w-full max-w-lg">
        <div
          class={`absolute -right-24 -top-28 h-72 w-72 animate-pop-blob rounded-sm bg-blue-400 p-8 opacity-45 mix-blend-multiply blur-3xl filter ${props.class ?? ''} ${props.className ?? ''} ${props.firstBlobColor}`}
        />
        <div
          class={`absolute -left-40 -top-64 h-72 w-72 animate-pop-blob rounded-sm bg-purple-400 p-8 opacity-45 mix-blend-multiply blur-3xl filter ${props.class ?? ''} ${props.className ?? ''} ${props.secondBlobColor}`}
        />
      </div>
    </div>
  )
}
