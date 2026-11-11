// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/avatar-circles.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { For, Show } from 'solid-js'

interface Avatar {
  imageUrl: string
  profileUrl: string
}

interface AvatarCirclesProps {
  /**
   * The number of extra people to show in the `+N` badge.
   */
  numPeople?: number
  /**
   * React parity alias; merges with `class`.
   */
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  /**
   * The avatars to render.
   */
  avatarUrls: Avatar[]
}

// PORT-NOTE: upstream merges classes with the `cn` helper; template merge with
// the Solid `class` alias keeps parity without the shadcn util.
export const AvatarCircles = (props: AvatarCirclesProps) => {
  return (
    <div
      class={`z-10 flex -space-x-4 rtl:space-x-reverse ${props.class ?? ''} ${props.className ?? ''}`}
    >
      <For each={props.avatarUrls}>
        {(url, index) => (
          <a href={url.profileUrl} target="_blank" rel="noopener noreferrer">
            <img
              class="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800"
              src={url.imageUrl}
              width={40}
              height={40}
              alt={`Avatar ${index() + 1}`}
            />
          </a>
        )}
      </For>
      <Show when={(props.numPeople ?? 0) > 0}>
        <a
          class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black text-center text-xs font-medium text-white hover:bg-gray-600 dark:border-gray-800 dark:bg-white dark:text-black"
          href="#avatars"
        >
          +{props.numPeople}
        </a>
      </Show>
    </div>
  )
}

export default AvatarCircles
